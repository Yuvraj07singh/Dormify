const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    moveInDate: {
        type: Date,
        required: true
    },
    moveOutDate: {
        type: Date,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    message: {
        type: String,
        default: ""
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
    paymentId: {
        type: String,
        default: ""
    },
    orderId: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);