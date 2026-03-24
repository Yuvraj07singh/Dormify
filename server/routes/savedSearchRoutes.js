const express = require("express");
const router = express.Router();
const SavedSearch = require("../models/SavedSearch");
const protect = require("../middleware/authMiddleware");

// POST /api/saved-search — Save a search configuration
router.post("/", protect, async (req, res) => {
    try {
        const { name, filters } = req.body;

        // Limit to 10 saved searches per user
        const count = await SavedSearch.countDocuments({ user: req.user._id });
        if (count >= 10) {
            return res.status(400).json({ message: "Maximum of 10 saved searches reached. Please delete one first." });
        }

        const savedSearch = await SavedSearch.create({
            user: req.user._id,
            name: name || "My Search Alert",
            filters: filters || {},
        });

        res.status(201).json(savedSearch);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/saved-search — Get all saved searches for this user
router.get("/", protect, async (req, res) => {
    try {
        const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(searches);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// DELETE /api/saved-search/:id — Delete a saved search
router.delete("/:id", protect, async (req, res) => {
    try {
        const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!search) return res.status(404).json({ message: "Saved search not found." });
        res.json({ message: "Deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PATCH /api/saved-search/:id/toggle — Toggle alert on/off
router.patch("/:id/toggle", protect, async (req, res) => {
    try {
        const search = await SavedSearch.findOne({ _id: req.params.id, user: req.user._id });
        if (!search) return res.status(404).json({ message: "Not found." });
        search.alertEnabled = !search.alertEnabled;
        await search.save();
        res.json(search);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
