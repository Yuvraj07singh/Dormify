const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    message: { type: String, required: true, maxlength: 1000 },
    moveInDate: { type: String },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
}, { timestamps: true });

inquirySchema.index({ landlord: 1, status: 1 });
inquirySchema.index({ property: 1 });

module.exports = mongoose.model("Inquiry", inquirySchema);
