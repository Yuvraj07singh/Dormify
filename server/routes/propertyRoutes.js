const router = require("express").Router();
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { validateRequest, schemas } = require("../middleware/validate");
const { cacheMiddleware, invalidateCacheMiddleware } = require("../utils/cache");

// Apply invalidation middleware for ANY state-mutating requests (POST, PUT, DELETE)
router.use(invalidateCacheMiddleware);

// Helper for pagination
const paginate = (page, limit) => {
    const p = parseInt(page) || 1;
    const l = Math.min(parseInt(limit) || 12, 50); // max 50 per page
    return { skip: (p - 1) * l, limit: l, page: p };
};

// CREATE DYNAMIC OSM PROPERTY
router.post("/cache-live", asyncHandler(async (req, res) => {
    const { osmId, title, propertyType, price, location, city, latitude, longitude, description, amenities, bedrooms, bathrooms } = req.body;
    
    if (!osmId) return res.status(400).json({ message: "osmId is required" });

    // Check if it already exists
    let existingProperty = await Property.findOne({ osmId });
    
    if (existingProperty) {
        return res.json({ propertyId: existingProperty._id });
    }

    // Create new
    const newProperty = await Property.create({
        title: title || "Live Accommodation",
        osmId,
        propertyType: propertyType || "apartment",
        price: price || 5000,
        location: location || "Nearby",
        city: city || "Unknown",
        latitude: latitude || 0,
        longitude: longitude || 0,
        locationData: {
            type: "Point",
            coordinates: [longitude || 0, latitude || 0]
        },
        description: description || "Automatically discovered via OpenStreetMap live data integration.",
        amenities: amenities || ["WiFi", "Security"],
        bedrooms: bedrooms || 1,
        bathrooms: bathrooms || 1,
        source: "OSM",
        isVerified: false,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"]
    });

    res.json({ propertyId: newProperty._id });
}));

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
        return res.json(properties);
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

// BUDGET ANALYZER STATS (server-side aggregation — no more pulling all properties to browser)
router.get("/stats/budget", asyncHandler(async (req, res) => {
    const { city, propertyType, furnished, maxBudget } = req.query;
    const budget = Number(maxBudget) || 20000;
    const BRACKET_SIZE = 2000;

    // Base filter
    const filter = { isAvailable: true };
    if (city) filter.city = new RegExp(city, "i");
    if (propertyType) filter.propertyType = propertyType;
    if (furnished === "true") filter.furnished = true;

    // Run all aggregations in parallel
    const [
        totalCount,
        affordableCount,
        avgPriceResult,
        brackets,
        topPicks,
        unlockAt2K,
        unlockAt5K
    ] = await Promise.all([
        // Total matching properties
        Property.countDocuments(filter),

        // Affordable (within budget)
        Property.countDocuments({ ...filter, price: { $lte: budget } }),

        // Average price of affordable listings
        Property.aggregate([
            { $match: { ...filter, price: { $lte: budget } } },
            { $group: { _id: null, avg: { $avg: "$price" }, min: { $min: "$price" }, max: { $max: "$price" } } }
        ]),

        // Price distribution in brackets
        Property.aggregate([
            { $match: filter },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: Array.from({ length: 11 }, (_, i) => i * BRACKET_SIZE),
                    default: "20000+",
                    output: { count: { $sum: 1 } }
                }
            }
        ]),

        // Top 3 affordable picks by rating
        Property.find({ ...filter, price: { $lte: budget } })
            .sort({ averageRating: -1 })
            .limit(3)
            .select("title city price images averageRating propertyType furnished")
            .lean(),

        // How many more at +₹2K
        Property.countDocuments({ ...filter, price: { $gt: budget, $lte: budget + 2000 } }),

        // How many more at +₹5K
        Property.countDocuments({ ...filter, price: { $gt: budget, $lte: budget + 5000 } }),
    ]);

    const avgStats = avgPriceResult[0] || { avg: 0, min: 0, max: 0 };
    const affordPct = totalCount > 0 ? Math.round((affordableCount / totalCount) * 100) : 0;

    // Normalize brackets
    const normalizedBrackets = [];
    for (let i = 0; i < 10; i++) {
        const low = i * BRACKET_SIZE;
        const high = (i + 1) * BRACKET_SIZE;
        const found = brackets.find(b => b._id === low);
        normalizedBrackets.push({
            low, high,
            count: found ? found.count : 0,
            isAffordable: high <= budget,
        });
    }
    // Handle overflow bucket
    const overflow = brackets.find(b => b._id === "20000+");
    if (overflow) {
        normalizedBrackets.push({ low: 20000, high: 99999, count: overflow.count, isAffordable: budget >= 20000 });
    }

    res.json({
        budget,
        totalCount,
        affordableCount,
        affordPct,
        avgPrice: Math.round(avgStats.avg || 0),
        minPrice: avgStats.min || 0,
        maxPrice: avgStats.max || 0,
        brackets: normalizedBrackets,
        topPicks,
        unlockAt2K,
        unlockAt5K,
    });
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
router.put("/:id", authMiddleware, validateRequest(schemas.updateProperty), asyncHandler(async (req, res) => {
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