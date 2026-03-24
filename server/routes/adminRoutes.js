const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");

// Apply auth + admin check to all routes
router.use(authMiddleware, adminMiddleware);

// GET PLATFORM STATS
router.get("/stats", asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalStudents,
        totalLandlords,
        totalProperties,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        revenueResult
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "landlord" }),
        Property.countDocuments(),
        Booking.countDocuments(),
        Booking.countDocuments({ status: "confirmed" }),
        Booking.countDocuments({ status: "pending" }),
        Booking.aggregate([
            { $match: { paymentStatus: "completed" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
        users: { total: totalUsers, students: totalStudents, landlords: totalLandlords },
        properties: { total: totalProperties },
        bookings: { total: totalBookings, confirmed: confirmedBookings, pending: pendingBookings },
        revenue: { total: totalRevenue }
    });
}));

// GET ALL USERS (paginated)
router.get("/users", asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (req.query.kycStatus) filter.kycStatus = req.query.kycStatus;
    if (search) filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
    ];

    const [users, total] = await Promise.all([
        User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter)
    ]);

    res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
}));

// UPDATE USER (ban/unban, change role)
router.put("/user/:id", asyncHandler(async (req, res) => {
    const { role, isBanned, verifiedLandlord } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (role) user.role = role;
    if (isBanned !== undefined) user.isBanned = isBanned;
    if (verifiedLandlord !== undefined) user.verifiedLandlord = verifiedLandlord;

    await user.save();
    const updated = user.toObject();
    delete updated.password;
    res.json(updated);
}));

// DELETE USER
router.delete("/user/:id", asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own admin account" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
}));

// GET ALL PROPERTIES (admin sees unverified too)
router.get("/properties", asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.isVerified !== undefined) filter.isVerified = req.query.isVerified === "true";

    const [properties, total] = await Promise.all([
        Property.find(filter)
            .populate("owner", "name email")
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit),
        Property.countDocuments(filter)
    ]);

    res.json({ data: properties, total, page, pages: Math.ceil(total / limit) });
}));

// APPROVE/REJECT KYC
router.put("/kyc/:userId", asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.kycStatus = status; // "verified" or "rejected"
    if (status === "verified") user.verifiedLandlord = true;
    if (status === "rejected") {
        user.verifiedLandlord = false;
        user.kycRejectionReason = reason || "Invalid documents provided";
    }
    
    await user.save();
    res.json({ message: `KYC updated to ${status}`, user });
}));

// VERIFY PROPERTY
router.put("/property/:id/verify", asyncHandler(async (req, res) => {
    const property = await Property.findByIdAndUpdate(
        req.params.id,
        { isVerified: req.body.isVerified !== false },
        { new: true }
    );
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json({ message: "Property verification updated", isVerified: property.isVerified });
}));

// ADMIN DELETE PROPERTY
router.delete("/property/:id", asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    await property.deleteOne();
    res.json({ message: "Property force-deleted by admin" });
}));

// GET ALL BOOKINGS (paginated)
router.get("/bookings", asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
        Booking.find()
            .populate("property", "title city price")
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit),
        Booking.countDocuments()
    ]);

    res.json({ data: bookings, total, page, pages: Math.ceil(total / limit) });
}));

module.exports = router;
