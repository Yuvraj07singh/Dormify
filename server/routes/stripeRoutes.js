const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const authMiddleware = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");
const Property = require("../models/Property");

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key");
const User = require("../models/User");

// --- STRIPE CONNECT ONBOARDING ---
router.post("/onboard-landlord", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== "landlord") return res.status(403).json({ message: "Only landlords can connect Stripe." });

        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_mock_key") {
            return res.status(500).json({ message: "Stripe API Key is missing. Please add STRIPE_SECRET_KEY in your .env" });
        }

        let accountId = user.stripeAccountId;

        // Create an Express account if they don't have one
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: "express",
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            accountId = account.id;
            user.stripeAccountId = accountId;
            await user.save();
        }

        // Generate an onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/landlord-dashboard?stripe_refresh=true`,
            return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/landlord-dashboard?stripe_onboarded=true`,
            type: "account_onboarding",
        });

        res.json({ url: accountLink.url });
    } catch (err) {
        console.error("Stripe Connect Error:", err);
        res.status(500).json({ message: err.message });
    }
});

router.get("/verify-stripe", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.stripeAccountId) {
            return res.json({ chargesEnabled: false });
        }
        
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        
        if (account.charges_enabled !== user.chargesEnabled) {
            user.chargesEnabled = account.charges_enabled;
            await user.save();
        }

        res.json({ chargesEnabled: user.chargesEnabled, details_submitted: account.details_submitted });
    } catch (err) {
        console.error("Stripe Verify Error:", err);
        res.status(500).json({ message: err.message });
    }
});


// CREATE CHECKOUT SESSION
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
    try {
        const { propertyId, propertyTitle, totalAmount, moveInDate, moveOutDate, message } = req.body;

        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_mock_key") {
            return res.status(500).json({ message: "Stripe API Key is missing. Please add STRIPE_SECRET_KEY in your .env" });
        }

        const property = await Property.findById(propertyId).populate("owner");
        
        let paymentIntentData = {};
        let adjustedAmount = Math.round(totalAmount * 100);

        // If the property has an owner, and the owner has connected their Stripe account
        if (property && property.owner && property.owner.stripeAccountId && property.owner.chargesEnabled) {
            const applicationFeeAmount = Math.round(adjustedAmount * 0.05); // 5% platform fee
            paymentIntentData = {
                application_fee_amount: applicationFeeAmount,
                transfer_data: {
                    destination: property.owner.stripeAccountId,
                },
            };
        }

        const sessionConfig = {
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `Booking for ${propertyTitle}`,
                        },
                        unit_amount: adjustedAmount,
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
        };

        if (Object.keys(paymentIntentData).length > 0) {
            Object.assign(sessionConfig, { payment_intent_data: paymentIntentData });
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

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
