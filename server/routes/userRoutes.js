const router = require("express").Router();
const User = require("../models/User");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");

// UPDATE OWN PROFILE — must be BEFORE /:id to avoid Express treating "profile" as an :id
router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, phone, university, bio, avatar } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // TEMPORARY ADMIN OVERRIDE FOR DEMO
        if (user.email === "student@dormify.com" || user.email === "admin@dormify.com") {
            user.role = "admin";
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (university !== undefined) user.university = university;
        if (bio !== undefined) user.bio = bio;
        if (avatar) user.avatar = avatar;

        await user.save();

        const userObj = user.toObject();
        delete userObj.password;
        res.json(userObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SUBMIT KYC DOCUMENTS
router.put("/kyc", authMiddleware, async (req, res) => {
    try {
        const { documentUrl } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role !== "landlord") return res.status(403).json({ message: "Only landlords require KYC." });

        user.kycDocumentUrl = documentUrl;
        user.kycStatus = "pending";
        user.kycRejectionReason = ""; // Clear any past rejection
        
        await user.save();
        res.json({ message: "KYC document submitted for review", kycStatus: user.kycStatus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET PUBLIC PROFILE — placed AFTER /profile route
router.get("/:id", async (req, res) => {
    try {
        // Guard against non-ObjectId params
        if (req.params.id === "profile") {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        // If landlord, also fetch their listings
        let listings = [];
        if (user.role === "landlord") {
            listings = await Property.find({ owner: user._id })
                .select("title images price location city propertyType averageRating totalReviews distanceFromCampus nearbyUniversity furnished bedrooms bathrooms")
                .sort({ createdAt: -1 });
        }

        res.json({ user, listings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
