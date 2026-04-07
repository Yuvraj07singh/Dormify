const router = require("express").Router();
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateRequest, schemas } = require("../middleware/validate");
const { sendBookingConfirmation } = require("../utils/emailService");
const { sendNewBookingToLandlord } = require("../utils/emailService");

// CREATE BOOKING (with validation + email)
router.post("/book", authMiddleware, validateRequest(schemas.booking), asyncHandler(async (req, res) => {
    const { propertyId, moveInDate, moveOutDate, message, paymentStatus, paymentId, orderId } = req.body;

    const property = await Property.findById(propertyId).populate("owner");
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (!property.isAvailable) return res.status(400).json({ message: "This property is no longer available" });

    // Duplicate / Overlap detection
    const overlapping = await Booking.findOne({
        property: propertyId,
        user: req.user.id,
        status: { $in: ["pending", "confirmed"] },
        $or: [
            { moveInDate: { $lt: new Date(moveOutDate) }, moveOutDate: { $gt: new Date(moveInDate) } }
        ]
    });
    if (overlapping) {
        return res.status(400).json({ message: "You already have an active booking for this property with overlapping dates." });
    }

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

    // Send confirmation email to tenant
    if (isConfirmed) {
        const user = await User.findById(req.user.id);
        sendBookingConfirmation(
            user.email, user.name,
            property.title, moveInDate, moveOutDate, totalAmount
        );
    }

    // Send notification email to landlord (fire and forget)
    if (property.owner && property.owner.email) {
        const tenant = await User.findById(req.user.id);
        sendNewBookingToLandlord(
            property.owner.email, property.owner.name,
            tenant.name, tenant.email,
            property.title, moveInDate, moveOutDate, totalAmount, isConfirmed ? "confirmed" : "pending"
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

// DOWNLOAD RECEIPT
router.get("/receipt/:id", authMiddleware, asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate("property", "title city price location images")
        .populate("user", "name email phone");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user._id.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dormify Receipt</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 40px; background: #f8fafc; }
  .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 32px; border-radius: 16px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; } .header p { margin: 8px 0 0; opacity: 0.85; }
  .card { background: white; border-radius: 16px; padding: 32px; margin-top: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .row:last-child { border-bottom: none; } .label { color: #64748b; font-size: 14px; } .value { font-weight: 700; color: #1e293b; }
  .total { font-size: 28px; color: #6366f1; text-align: center; margin-top: 16px; font-weight: 800; }
  .footer { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px; }
  .badge { display: inline-block; padding: 4px 16px; border-radius: 99px; font-size: 12px; font-weight: 700; }
  .confirmed { background: #d1fae5; color: #065f46; } .pending { background: #fef3c7; color: #92400e; }
</style></head><body>
  <div class="header">
    <h1>🏠 Dormify</h1>
    <p>Booking Receipt</p>
  </div>
  <div class="card">
    <div class="row"><span class="label">Receipt ID</span><span class="value">${booking._id}</span></div>
    <div class="row"><span class="label">Property</span><span class="value">${booking.property?.title || "—"}</span></div>
    <div class="row"><span class="label">Location</span><span class="value">${booking.property?.city || "—"}</span></div>
    <div class="row"><span class="label">Tenant</span><span class="value">${booking.user?.name || "—"} (${booking.user?.email || "—"})</span></div>
    <div class="row"><span class="label">Move-in</span><span class="value">${new Date(booking.moveInDate).toDateString()}</span></div>
    <div class="row"><span class="label">Move-out</span><span class="value">${new Date(booking.moveOutDate).toDateString()}</span></div>
    <div class="row"><span class="label">Payment</span><span class="value"><span class="badge ${booking.paymentStatus === 'completed' ? 'confirmed' : 'pending'}">${booking.paymentStatus}</span></span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge ${booking.status === 'confirmed' ? 'confirmed' : 'pending'}">${booking.status}</span></span></div>
    <div class="total">₹${(booking.totalAmount || 0).toLocaleString("en-IN")}</div>
  </div>
  <div class="footer">
    <p>Generated on ${new Date().toDateString()} • Dormify — Premium Student Housing Platform</p>
    <p>This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename=dormify-receipt-${booking._id}.html`);
    res.send(html);
}));

// AUTO-EXPIRE STALE PENDING BOOKINGS (called on server startup or cron)
const expireStalePendingBookings = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const result = await Booking.updateMany(
        { status: "pending", paymentStatus: { $ne: "completed" }, createdAt: { $lt: cutoff } },
        { status: "cancelled" }
    );
    if (result.modifiedCount > 0) console.log(`⏰ Expired ${result.modifiedCount} stale pending bookings`);
};

// Run expiry on module load and then every 6 hours
expireStalePendingBookings();
setInterval(expireStalePendingBookings, 6 * 60 * 60 * 1000);

module.exports = router;