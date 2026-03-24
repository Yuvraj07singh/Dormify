const router = require("express").Router();
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateRequest, schemas } = require("../middleware/validate");
const { cacheMiddleware, invalidateCacheMiddleware } = require("../utils/cache");

// Apply invalidation middleware for ANY state-mutating requests (POST, PUT, DELETE)
router.use(invalidateCacheMiddleware);

// Helper for pagination
const paginate = (query, page, limit) => {
    const p = parseInt(page) || 1;
    const l = Math.min(parseInt(limit) || 12, 50); // max 50 per page
    return { skip: (p - 1) * l, limit: l, page: p };
};

// GET ALL PROPERTIES (with filters + pagination + sort) - NOW CACHED 🔥
router.get("/", cacheMiddleware, asyncHandler(async (req, res) => {
    const { city, minPrice, maxPrice, propertyType, university, furnished, search, lat, lng, radius, page, limit, sort } = req.query;
    let filter = { isAvailable: true };

    // Geospatial query
    if (lat && lng) {
        filter.locationData = {
            $near: {
                $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                $maxDistance: radius ? Number(radius) : 5000
            }
        };
    }

    if (city) filter.city = new RegExp(city, "i");
    if (propertyType) filter.propertyType = propertyType;
    if (university) filter.nearbyUniversity = new RegExp(university, "i");
    if (furnished === "true") filter.furnished = true;
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
        filter.$or = [
            { title: new RegExp(search, "i") },
            { description: new RegExp(search, "i") },
            { location: new RegExp(search, "i") },
            { city: new RegExp(search, "i") },
            { nearbyUniversity: new RegExp(search, "i") }
        ];
    }

    // Sort options
    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        rating: { averageRating: -1 },
        popular: { viewCount: -1 }
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    // If geo query is active, we can't use skip/limit easily with $near — return all results
    if (lat && lng) {
        const properties = await Property.find(filter)
            .populate("owner", "name email phone avatar verifiedLandlord")
            .sort(sortBy);
        return res.json({ data: properties, total: properties.length, page: 1, pages: 1 });
    }

    const { skip, limit: lim, page: p } = paginate(page, limit);
    const [properties, total] = await Promise.all([
        Property.find(filter)
            .populate("owner", "name email phone avatar verifiedLandlord")
            .sort(sortBy)
            .skip(skip)
            .limit(lim),
        Property.countDocuments(filter)
    ]);

    res.json({ data: properties, total, page: p, pages: Math.ceil(total / lim) });
}));

// GET FEATURED PROPERTIES
router.get("/featured", asyncHandler(async (req, res) => {
    const properties = await Property.find({ isAvailable: true })
        .populate("owner", "name email phone avatar verifiedLandlord")
        .sort({ averageRating: -1, viewCount: -1 })
        .limit(6);
    res.json(properties);
}));

// GET SINGLE PROPERTY (with view count increment)
router.get("/:id", asyncHandler(async (req, res) => {
    const property = await Property.findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { new: true }
    )
        .populate("owner", "name email phone avatar verifiedLandlord responseTime bio")
        .populate("reviews.user", "name avatar");

    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
}));

// ADD PROPERTY (landlords only)
router.post("/add", authMiddleware, validateRequest(schemas.addProperty), asyncHandler(async (req, res) => {
    if (req.user.role !== "landlord" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only landlords can add properties" });
    }

    const property = await Property.create({
        ...req.body,
        owner: req.user.id,
        propertyType: req.body.propertyType || "apartment",
        locationData: {
            type: "Point",
            coordinates: [Number(req.body.longitude) || 0, Number(req.body.latitude) || 0]
        }
    });

    res.status(201).json(property);
}));

// UPDATE PROPERTY
router.put("/:id", authMiddleware, asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.owner.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(property, req.body);
    if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
        property.locationData = {
            type: "Point",
            coordinates: [req.body.longitude || property.longitude, req.body.latitude || property.latitude]
        };
    }

    await property.save();
    res.json(property);
}));

// DELETE PROPERTY
router.delete("/:id", authMiddleware, asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.owner.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
    }

    await property.deleteOne();
    res.json({ message: "Property deleted successfully" });
}));

// ADD REVIEW
router.post("/:id/review", authMiddleware, validateRequest(schemas.addReview), asyncHandler(async (req, res) => {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const alreadyReviewed = property.reviews.find(r => r.user.toString() === req.user.id);
    if (alreadyReviewed) return res.status(400).json({ message: "You have already reviewed this property" });

    property.reviews.push({ user: req.user.id, rating: req.body.rating, comment: req.body.comment });
    property.calculateAverageRating();
    await property.save();

    // Increment inquiry count
    await Property.findByIdAndUpdate(req.params.id, { $inc: { inquiryCount: 1 } });

    const updated = await Property.findById(req.params.id).populate("reviews.user", "name avatar");
    res.status(201).json(updated);
}));

module.exports = router;