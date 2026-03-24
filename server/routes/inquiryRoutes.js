const express = require("express");
const router = express.Router();
const Inquiry = require("../models/Inquiry");
const Property = require("../models/Property");
const protect = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/emailService");

// POST /api/inquiry — Submit a new inquiry
router.post("/", async (req, res) => {
    try {
        const { propertyId, name, email, phone, message, moveInDate } = req.body;

        if (!propertyId || !name || !email || !message) {
            return res.status(400).json({ message: "Property, name, email, and message are required." });
        }

        const property = await Property.findById(propertyId).populate("owner", "name email");
        if (!property) return res.status(404).json({ message: "Property not found." });

        const inquiry = await Inquiry.create({
            property: propertyId,
            landlord: property.owner._id,
            student: req.user?._id || null,
            name,
            email,
            phone,
            message,
            moveInDate,
        });

        // Send email to landlord
        try {
            await sendEmail({
                to: property.owner.email,
                subject: `📬 New Inquiry for "${property.title}"`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
                        <h2 style="color: #6366f1;">New Student Inquiry — Dormify</h2>
                        <p><strong>Property:</strong> ${property.title}</p>
                        <p><strong>Student Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
                        ${moveInDate ? `<p><strong>Move-in Date:</strong> ${moveInDate}</p>` : ""}
                        <div style="background: #fff; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 16px 0;">
                            <p style="margin:0;"><strong>Message:</strong></p>
                            <p style="color: #475569; margin: 8px 0 0;">${message}</p>
                        </div>
                        <p style="color:#94a3b8; font-size: 12px;">Reply directly to this email to contact the student.</p>
                    </div>
                `,
            });
        } catch (e) {
            console.error("Inquiry email failed:", e.message);
        }

        res.status(201).json({ message: "Inquiry submitted successfully!", inquiry });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/inquiry/landlord — Get all inquiries for this landlord's properties
router.get("/landlord", protect, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ landlord: req.user._id })
            .populate("property", "title images city price")
            .sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PATCH /api/inquiry/:id/status — Mark inquiry as read or replied
router.patch("/:id/status", protect, async (req, res) => {
    try {
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id, landlord: req.user._id },
            { status: req.body.status },
            { new: true }
        );
        if (!inquiry) return res.status(404).json({ message: "Inquiry not found." });
        res.json(inquiry);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;
