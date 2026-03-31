// Simple validation helpers — returns error message string or null
const validate = {
    isEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) ? null : "Please provide a valid email address";
    },
    minLength: (val, min, field) => {
        return val && val.length >= min ? null : `${field} must be at least ${min} characters`;
    },
    isPositiveNumber: (val, field) => {
        return val > 0 ? null : `${field} must be a positive number`;
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
        return errors;
    },
    addReview: (body) => {
        const errors = [];
        const rating = Number(body.rating);
        if (!rating || rating < 1 || rating > 5) errors.push("Rating must be between 1 and 5");
        if (!body.comment || body.comment.trim().length < 5) errors.push("Review comment must be at least 5 characters");
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
        return errors;
    },
    forgotPassword: (body) => {
        const errors = [];
        const emailErr = validate.isEmail(body.email);
        if (emailErr) errors.push(emailErr);
        return errors;
    }
};

module.exports = { validate, validateRequest, schemas };
