const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    osmId: {
        type: String,
        unique: true,
        sparse: true
    },
    description: {
        type: String,
        required: true
    },
    propertyType: {
        type: String,
        enum: ["apartment", "studio", "shared-room", "private-room", "dorm", "house"],
        default: "apartment"
    },
    location: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        default: ""
    },
    nearbyUniversity: {
        type: String,
        default: ""
    },
    distanceFromCampus: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: true
    },
    priceType: {
        type: String,
        enum: ["month", "semester", "year"],
        default: "month"
    },
    images: [{
        type: String
    }],
    amenities: [{
        type: String
    }],
    bedrooms: {
        type: Number,
        default: 1
    },
    bathrooms: {
        type: Number,
        default: 1
    },
    maxOccupants: {
        type: Number,
        default: 1
    },
    furnished: {
        type: Boolean,
        default: false
    },
    availableFrom: {
        type: Date,
        default: Date.now
    },
    leaseDuration: {
        type: String,
        default: "12 months"
    },
    genderPreference: {
        type: String,
        enum: ["any", "male", "female"],
        default: "any"
    },
    reviews: [reviewSchema],
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    latitude: {
        type: Number,
        default: 0
    },
    longitude: {
        type: Number,
        default: 0
    },
    locationData: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0] // [longitude, latitude]
        }
    },
    source: {
        type: String,
        enum: ["JustDial", "99acres", "MagicBricks", "Direct", "OSM"],
        default: "Direct"
    },
    contactNumber: {
        type: String,
        default: ""
    },
    virtualTourUrl: { type: String, default: "" },
    floorPlan: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    inquiryCount: { type: Number, default: 0 },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

propertySchema.index({ locationData: "2dsphere" });

propertySchema.methods.calculateAverageRating = function() {
    if (this.reviews.length === 0) {
        this.averageRating = 0;
        this.totalReviews = 0;
    } else {
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
        this.totalReviews = this.reviews.length;
    }
};

module.exports = mongoose.model("Property", propertySchema);