const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    return process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;
};

// Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "dormify",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto" }]
    }
});

// Fallback in-memory storage if Cloudinary not configured
const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: isCloudinaryConfigured() ? storage : memoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
        } else {
            cb(null, true);
        }
    }
});

module.exports = { upload, cloudinary, isCloudinaryConfigured };
