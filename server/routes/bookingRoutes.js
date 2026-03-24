const router = require("express").Router();
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateRequest, schemas } = require("../middleware/validate");
const { sendBookingConfirmation } = require("../utils/emailService");

// CREATE BOOKING (with validation + email)
router.post("/book", authMiddleware, validateRequest(schemas.booking), asyncHandler(async (req, res) => {
    const { propertyId, moveInDate, moveOutDate, message, paymentStatus, paymentId, orderId } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (!property.isAvailable) return res.status(400).json({ message: "This property is no longer available" });

    // Calculate duration and amount
    const start = new Date(moveInDate);
    const end = new Date(moveOutDate);
    const months = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));
    const totalAmount = property.price * months;

    const isConfirmed = paymentStatus === "completed";

    const booking = await Booking.create({
        property: propertyId,
        user: req.user.id,
        moveInDate,
        moveOutDate,
        totalAmount,
        message: message || "",
        status: isConfirmed ? "confirmed" : "pending",
        paymentStatus: paymentStatus || "pending",
        paymentId: paymentId || "",
        orderId: orderId || ""
    });

    // Send confirmation email (fire and forget)
    if (isConfirmed) {
        const User = require("../models/User");
        const user = await User.findById(req.user.id);
        sendBookingConfirmation(
            user.email, user.name,
            property.title, moveInDate, moveOutDate, totalAmount
        );
    }

    const populated = await Booking.findById(booking._id)
        .populate("property", "title city price images")
        .populate("user", "name email");

    res.status(201).json(populated);
}));

// GET MY BOOKINGS (paginated)
router.get("/my", authMiddleware, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
        Booking.find({ user: req.user.id })
            .populate({
                path: "property",
                populate: { path: "owner", select: "name email phone" }
            })
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit),
        Booking.countDocuments({ user: req.user.id })
    ]);

    res.json({ data: bookings, total, page, pages: Math.ceil(total / limit) });
}));

// GET BOOKINGS FOR LANDLORD'S PROPERTIES (paginated)
router.get("/landlord", authMiddleware, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const properties = await Property.find({ owner: req.user.id }).select("_id");
    const propertyIds = properties.map(p => p._id);

    const [bookings, total] = await Promise.all([
        Booking.find({ property: { $in: propertyIds } })
            .populate("property", "title city price")
            .populate("user", "name email phone university")
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit),
        Booking.countDocuments({ property: { $in: propertyIds } })
    ]);

    res.json({ data: bookings, total, page, pages: Math.ceil(total / limit) });
}));

// UPDATE BOOKING STATUS
router.put("/:id/status", authMiddleware, asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("property", "owner title");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the landlord of the property or admin can update status
    const isLandlord = booking.property?.owner?.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isLandlord && !isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    booking.status = req.body.status;
    await booking.save();
    res.json(booking);
}));

// CANCEL BOOKING (tenant)
router.delete("/:id", authMiddleware, asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
    }
    if (booking.status === "confirmed" && booking.paymentStatus === "completed") {
        return res.status(400).json({ message: "Cannot cancel a confirmed paid booking. Contact support." });
    }

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled" });
}));

module.exports = router;