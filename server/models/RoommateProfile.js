const mongoose = require("mongoose");

const roommateProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    budget: { type: Number, required: true, min: 1000 },
    moveInDate: { type: Date },
    duration: { type: String, enum: ["1-3 months", "3-6 months", "6-12 months", "1+ year", "flexible"], default: "flexible" },
    genderPref: { type: String, enum: ["male", "female", "any"], default: "any" },
    lifestyle: {
        sleepSchedule: { type: String, enum: ["early-bird", "night-owl", "flexible"], default: "flexible" },
        diet:          { type: String, enum: ["veg", "non-veg", "vegan", "any"],       default: "any" },
        cleanliness:   { type: String, enum: ["very-clean", "average", "relaxed"],     default: "average" },
        smoking:       { type: Boolean, default: false },
        pets:          { type: Boolean, default: false },
        studyHabits:   { type: String, enum: ["quiet-studious", "social", "balanced"], default: "balanced" },
        workFromHome:  { type: Boolean, default: false },
    },
    about: { type: String, maxlength: 400 },
    lookingFor: { type: String, maxlength: 200 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("RoommateProfile", roommateProfileSchema);
