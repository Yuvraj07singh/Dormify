const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ─── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = [
    "http://localhost:3000",
    "https://dormify-one.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/+$/, "")); // Remove trailing slashes

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Normalize the incoming origin by removing trailing slash
        const normalizedOrigin = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// ─── Logging ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Rate Limiting ─────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { message: "Too many requests, please try again in 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts, please try again in 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ─── Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
        methods: ["GET", "POST"]
    }
});

// ─── Routes ────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/property", require("./routes/propertyRoutes"));
app.use("/api/booking",  require("./routes/bookingRoutes"));
app.use("/api/seed",     require("./routes/seedRoutes"));
app.use("/api/chat",     require("./routes/chatRoutes"));
app.use("/api/user",     require("./routes/userRoutes"));
app.use("/api/payment",  require("./routes/paymentRoutes"));
app.use("/api/upload",   require("./routes/uploadRoutes"));
app.use("/api/admin",        require("./routes/adminRoutes"));
app.use("/api/inquiry",      require("./routes/inquiryRoutes"));
app.use("/api/saved-search", require("./routes/savedSearchRoutes"));
app.use("/api/stripe",       require("./routes/stripeRoutes"));
app.use("/api/roommate",     require("./routes/roommateRoutes"));

// ─── Health Check ──────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "🏠 Dormify API Running",
        version: "2.0.0",
        timestamp: new Date().toISOString()
    });
});

// ─── 404 Handler ───────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Database ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));

// ─── Socket.io: Real-Time Chat ─────────────────────────────────────
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

io.on("connection", (socket) => {
    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    });

    socket.on("send-message", async (data) => {
        try {
            const { conversationId, senderId, text } = data;
            const message = new Message({ conversation: conversationId, sender: senderId, text });
            await message.save();

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: text,
                lastMessageAt: new Date()
            });

            const populated = await Message.findById(message._id)
                .populate("sender", "name avatar role");

            io.to(conversationId).emit("new-message", populated);
        } catch (err) {
            console.error("Socket message error:", err.message);
        }
    });

    socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("user-typing", { userId: data.userId, name: data.name });
    });

    socket.on("stop-typing", (data) => {
        socket.to(data.conversationId).emit("user-stop-typing", { userId: data.userId });
    });

    socket.on("disconnect", () => {});
});

// ─── Server Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));