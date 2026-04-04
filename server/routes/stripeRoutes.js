const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const authMiddleware = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key");

// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
    try {
        const { propertyId, propertyTitle, totalAmount, moveInDate, moveOutDate, message } = req.body;

        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_mock_key") {
            return res.status(500).json({ message: "Stripe API Key is missing. Please add STRIPE_SECRET_KEY in your .env" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `Booking for ${propertyTitle}`,
                        },
                        unit_amount: totalAmount * 100, // Amount in paise
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/property/${propertyId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/property/${propertyId}?canceled=true`,
            metadata: {
                propertyId,
                userId: req.user.id,
                moveInDate,
                moveOutDate,
                message: message || ""
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (err) {
        console.error("Stripe create checkout error:", err);
        res.status(500).json({ message: err.message });
    }
});

// WEBHOOK HANDLER
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Stripe Webhook Error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        
        try {
            // Optional: You could create the booking directly from the webhook
            // We already handle booking creation on success callback, but doing it here is safer
            console.log("Payment successful for session:", session.id);
        } catch (err) {
            console.error("Failed to process successful payment:", err);
        }
    }

    res.json({ received: true });
});

module.exports = router;
