const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["student", "landlord", "admin"],
        default: "student"
    },
    university: { type: String, default: "" },
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    verifiedLandlord: { type: Boolean, default: false },
    kycStatus: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified"
    },
    kycDocumentUrl: { type: String, default: "" },
    kycRejectionReason: { type: String, default: "" },
    responseTime: { type: String, default: "Within 24 hours" },
    isBanned: { type: Boolean, default: false },
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    // Password reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);