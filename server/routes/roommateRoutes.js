const express = require("express");
const router = express.Router();
const RoommateProfile = require("../models/RoommateProfile");
const { protect } = require("../middleware/auth");
const { validateRequest, sanitizeBody, schemas } = require("../middleware/validate");

// Apply sanitization to all POST/PUT requests
router.use(sanitizeBody);

// GET all active profiles (with optional city/budget filter)
router.get("/", async (req, res) => {
    try {
        const { city, maxBudget, minBudget, genderPref, duration } = req.query;
        const filter = { isActive: true };
        if (city) filter.city = { $regex: city, $options: "i" };
        if (maxBudget) filter.budget = { ...filter.budget, $lte: Number(maxBudget) };
        if (minBudget) filter.budget = { ...filter.budget, $gte: Number(minBudget) };
        if (genderPref && genderPref !== "any") filter.genderPref = { $in: [genderPref, "any"] };
        if (duration) filter.duration = duration;

        const profiles = await RoommateProfile.find(filter)
            .populate("user", "name profileImage university")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: profiles });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET my profile
router.get("/mine", protect, async (req, res) => {
    try {
        const profile = await RoommateProfile.findOne({ user: req.user._id })
            .populate("user", "name profileImage university");
        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create or update my profile (upsert)
router.post("/", protect, validateRequest(schemas.roommateProfile), async (req, res) => {
    try {
        const profile = await RoommateProfile.findOneAndUpdate(
            { user: req.user._id },
            { ...req.body, user: req.user._id },
            { upsert: true, new: true, runValidators: true }
        ).populate("user", "name profileImage university");
        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// DELETE deactivate my profile
router.delete("/", protect, async (req, res) => {
    try {
        await RoommateProfile.findOneAndUpdate({ user: req.user._id }, { isActive: false });
        res.json({ success: true, message: "Profile deactivated" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
