const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");

// Initialize Razorpay (using test mode keys if not defined)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YourTestSecretHere"
});

// CREATE ORDER
router.post("/create-order", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR
        
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: `receipt_order_${Math.floor(Math.random() * 10000)}`
        };

        // Force real authentication check
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_YourTestKeyHere") {
            return res.status(401).json({ message: "Valid Razorpay API Key is missing from the .env file" });
        }

        const order = await razorpay.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ message: "Failed to create order" });
        }

        res.json(order);
    } catch (error) {
        console.error("Razorpay order error:", error);
        res.status(500).json({ message: error.message });
    }
});

// VERIFY PAYMENT
router.post("/verify", authMiddleware, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        // Force authentic signature validation check
        if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === "YourTestSecretHere") {
            return res.status(401).json({ message: "Valid Razorpay Secret missing for Signature Verification" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Razorpay verification error:", error);
        res.status(500).json({ message: error.message });
    }
});

// WEBHOOK HANDLER
router.post("/webhook", async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("Razorpay webhook secret missing");
            return res.status(400).send("Webhook secret missing");
        }

        const signature = req.headers["x-razorpay-signature"];
        const crypto = require("crypto");
        
        // req.body is a buffer here because of express.raw() in server.js
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(req.body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Invalid webhook signature");
            return res.status(400).send("Invalid signature");
        }

        const payload = JSON.parse(req.body.toString());
        const event = payload.event;
        
        if (event === "payment.captured" || event === "order.paid") {
            const paymentInfo = payload.payload.payment.entity;
            console.log("PAYMENT CAPTURED/PAID via Webhook:", paymentInfo.id);
            // Handle DB updates securely here (e.g., mark booking as paid)
        }

        res.status(200).send("Webhook received");
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).send("Webhook processing error");
    }
});

module.exports = router;
