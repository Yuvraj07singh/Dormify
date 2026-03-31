const router = require("express").Router();
const Stripe = require("stripe");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

// We use Stripe's literal generic test key so the UI physically loads for the MVP
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", authMiddleware, async (req, res) => {
    try {
        const { propertyId, propertyTitle, totalAmount, moveInDate, moveOutDate, message } = req.body;

        // Fetch user email from DB (JWT only stores id + role)
        const user = await User.findById(req.user.id).select("email name");
        if (!user) return res.status(401).json({ message: "User not found" });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `Booking: ${propertyTitle}`,
                        },
                        unit_amount: totalAmount * 100, // Stripe expects paise/cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "https://dormify-one.vercel.app"}/property/${propertyId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "https://dormify-one.vercel.app"}/property/${propertyId}?canceled=true`,
            customer_email: user.email,
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
