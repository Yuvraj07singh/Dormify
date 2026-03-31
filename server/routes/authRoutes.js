const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateRequest, schemas } = require("../middleware/validate");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/emailService");

const signToken = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

// REGISTER
router.post("/register", validateRequest(schemas.register), asyncHandler(async (req, res) => {
    const { name, email, password, role, university, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || "student",
        university: university || "",
        phone: phone || ""
    });

    // Send welcome email (fire and forget)
    sendWelcomeEmail(user.email, user.name);

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({ token, user: userObj });
}));

// LOGIN
router.post("/login", validateRequest(schemas.login), asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    // Check if banned
    if (user.isBanned) return res.status(403).json({ message: "Account suspended. Contact support." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user);
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
}));

// GET CURRENT USER
router.get("/me", authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
}));

// TOGGLE SAVE PROPERTY
router.post("/save/:propertyId", authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    const propertyId = req.params.propertyId;

    const index = user.savedProperties.indexOf(propertyId);
    if (index > -1) {
        user.savedProperties.splice(index, 1);
    } else {
        user.savedProperties.push(propertyId);
    }

    await user.save();
    res.json({ savedProperties: user.savedProperties });
}));

// FORGOT PASSWORD
router.post("/forgot-password", validateRequest(schemas.forgotPassword), asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    // Always respond with success to prevent email enumeration
    if (!user) {
        return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "https://dormify-one.vercel.app"}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: "If that email is registered, a reset link has been sent." });
}));

// RESET PASSWORD
router.post("/reset-password/:token", asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Reset token is invalid or has expired" });

    const pwErr = req.body.password && req.body.password.length < 8
        ? "Password must be at least 8 characters"
        : null;
    if (pwErr) return res.status(400).json({ message: pwErr });

    user.password = await bcrypt.hash(req.body.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
}));

module.exports = router;