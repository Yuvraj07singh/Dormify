const mongoose = require("mongoose");

const savedSearchSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "My Search Alert" },
    filters: {
        search: { type: String, default: "" },
        propertyType: { type: String, default: "" },
        minPrice: { type: Number },
        maxPrice: { type: Number },
        furnished: { type: Boolean, default: false },
        city: { type: String },
    },
    alertEnabled: { type: Boolean, default: true },
    lastNotified: { type: Date },
}, { timestamps: true });

savedSearchSchema.index({ user: 1 });

module.exports = mongoose.model("SavedSearch", savedSearchSchema);
