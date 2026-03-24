// Global Async Error Handler — wraps any async route to prevent unhandled rejections
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global Error Handler Middleware — must be registered LAST in server.js
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid resource ID format" });
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: messages.join(", ") });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `${field} already exists` });
    }

    // JWT Errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please log in again" });
    }

    console.error(`[ERROR] ${err.message}`, err.stack);
    res.status(statusCode).json({
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = { asyncHandler, errorHandler };
