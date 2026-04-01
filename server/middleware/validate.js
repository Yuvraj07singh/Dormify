// Simple validation helpers — returns error message string or null
const validate = {
    isEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) ? null : "Please provide a valid email address";
    },
    minLength: (val, min, field) => {
        return val && val.length >= min ? null : `${field} must be at least ${min} characters`;
    },
    maxLength: (val, max, field) => {
        return !val || val.length <= max ? null : `${field} must be at most ${max} characters`;
    },
    isPositiveNumber: (val, field) => {
        return val > 0 ? null : `${field} must be a positive number`;
    },
    isInRange: (val, min, max, field) => {
        const n = Number(val);
        return n >= min && n <= max ? null : `${field} must be between ${min} and ${max}`;
    },
    isValidDate: (dateStr, field) => {
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? null : `${field} must be a valid date`;
    },
    isFutureDate: (dateStr, field) => {
        const d = new Date(dateStr);
        return d > new Date() ? null : `${field} must be a future date`;
    },
    isEnum: (val, values, field) => {
        return values.includes(val) ? null : `${field} must be one of: ${values.join(", ")}`;
    }
};

// Strip HTML tags and dangerous characters from text fields (XSS prevention)
const sanitizeText = (text) => {
    if (typeof text !== "string") return text;
    return text
        .replace(/<[^>]*>/g, "")         // Strip HTML tags
        .replace(/[<>]/g, "")            // Remove leftover angle brackets
        .replace(/javascript:/gi, "")     // Strip javascript: protocol
        .replace(/on\w+\s*=/gi, "")      // Strip event handlers (onclick=, etc.)
        .trim();
};

// Middleware: recursively sanitize all string fields in req.body
const sanitizeBody = (req, res, next) => {
    const sanitize = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "string") {
                obj[key] = sanitizeText(obj[key]);
            } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                sanitize(obj[key]);
            }
        }
        return obj;
    };
    if (req.body) sanitize(req.body);
    next();
};

// Middleware factory: given a validation function, returns express middleware
const validateRequest = (validationFn) => (req, res, next) => {
    const errors = validationFn(req.body, req.params, req.query);
    if (errors && errors.length > 0) {
        return res.status(400).json({ message: errors[0], errors });
    }
    next();
};

// Predefined validation schemas
const schemas = {
    register: (body) => {
        const errors = [];
        const emailErr = validate.isEmail(body.email);
        const pwErr = validate.minLength(body.password, 8, "Password");
        const nameErr = validate.minLength(body.name, 2, "Name");
        if (emailErr) errors.push(emailErr);
        if (pwErr) errors.push(pwErr);
        if (nameErr) errors.push(nameErr);
        return errors;
    },
    login: (body) => {
        const errors = [];
        if (!body.email) errors.push("Email is required");
        if (!body.password) errors.push("Password is required");
        return errors;
    },
    addProperty: (body) => {
        const errors = [];
        if (!body.title) errors.push("Property title is required");
        if (!body.city) errors.push("City is required");
        const priceErr = validate.isPositiveNumber(Number(body.price), "Price");
        if (priceErr) errors.push(priceErr);
        const typeErr = validate.isEnum(body.propertyType,
            ["apartment", "studio", "shared-room", "private-room", "dorm", "house"], "Property Type");
        if (typeErr) errors.push(typeErr);
        const titleLen = validate.maxLength(body.title, 120, "Title");
        if (titleLen) errors.push(titleLen);
        if (body.price && Number(body.price) > 500000) errors.push("Price seems unreasonably high (max ₹5,00,000)");
        return errors;
    },
    updateProperty: (body) => {
        const errors = [];
        if (body.price !== undefined) {
            const priceErr = validate.isPositiveNumber(Number(body.price), "Price");
            if (priceErr) errors.push(priceErr);
            if (Number(body.price) > 500000) errors.push("Price seems unreasonably high");
        }
        if (body.propertyType) {
            const typeErr = validate.isEnum(body.propertyType,
                ["apartment", "studio", "shared-room", "private-room", "dorm", "house"], "Property Type");
            if (typeErr) errors.push(typeErr);
        }
        if (body.title) {
            const titleLen = validate.maxLength(body.title, 120, "Title");
            if (titleLen) errors.push(titleLen);
        }
        return errors;
    },
    addReview: (body) => {
        const errors = [];
        const rating = Number(body.rating);
        if (!rating || rating < 1 || rating > 5) errors.push("Rating must be between 1 and 5");
        if (!body.comment || body.comment.trim().length < 5) errors.push("Review comment must be at least 5 characters");
        const commentLen = validate.maxLength(body.comment, 1000, "Comment");
        if (commentLen) errors.push(commentLen);
        return errors;
    },
    booking: (body) => {
        const errors = [];
        if (!body.propertyId) errors.push("Property ID is required");
        if (!body.moveInDate) errors.push("Move-in date is required");
        if (!body.moveOutDate) errors.push("Move-out date is required");
        if (body.moveInDate && body.moveOutDate) {
            const start = new Date(body.moveInDate);
            const end = new Date(body.moveOutDate);
            if (start >= end) errors.push("Move-out date must be after move-in date");
            if (start <= new Date()) errors.push("Move-in date must be a future date");
        }
        if (body.message) {
            const msgLen = validate.maxLength(body.message, 500, "Message");
            if (msgLen) errors.push(msgLen);
        }
        return errors;
    },
    forgotPassword: (body) => {
        const errors = [];
        const emailErr = validate.isEmail(body.email);
        if (emailErr) errors.push(emailErr);
        return errors;
    },
    roommateProfile: (body) => {
        const errors = [];
        if (!body.city || body.city.trim().length < 2) errors.push("City is required (min 2 characters)");
        if (!body.budget || Number(body.budget) < 1000) errors.push("Budget must be at least ₹1,000");
        if (Number(body.budget) > 200000) errors.push("Budget seems unreasonably high (max ₹2,00,000)");
        if (body.genderPref) {
            const gErr = validate.isEnum(body.genderPref, ["male", "female", "any"], "Gender preference");
            if (gErr) errors.push(gErr);
        }
        if (body.duration) {
            const dErr = validate.isEnum(body.duration, ["1-3 months", "3-6 months", "6-12 months", "1+ year", "flexible"], "Duration");
            if (dErr) errors.push(dErr);
        }
        if (body.about) {
            const aLen = validate.maxLength(body.about, 400, "About");
            if (aLen) errors.push(aLen);
        }
        if (body.lookingFor) {
            const lLen = validate.maxLength(body.lookingFor, 200, "Looking For");
            if (lLen) errors.push(lLen);
        }
        if (body.lifestyle) {
            const ls = body.lifestyle;
            if (ls.sleepSchedule) {
                const sErr = validate.isEnum(ls.sleepSchedule, ["early-bird", "night-owl", "flexible"], "Sleep schedule");
                if (sErr) errors.push(sErr);
            }
            if (ls.diet) {
                const dErr = validate.isEnum(ls.diet, ["veg", "non-veg", "vegan", "any"], "Diet");
                if (dErr) errors.push(dErr);
            }
            if (ls.cleanliness) {
                const cErr = validate.isEnum(ls.cleanliness, ["very-clean", "average", "relaxed"], "Cleanliness");
                if (cErr) errors.push(cErr);
            }
            if (ls.studyHabits) {
                const stErr = validate.isEnum(ls.studyHabits, ["quiet-studious", "social", "balanced"], "Study habits");
                if (stErr) errors.push(stErr);
            }
        }
        return errors;
    },
};

module.exports = { validate, validateRequest, sanitizeText, sanitizeBody, schemas };
