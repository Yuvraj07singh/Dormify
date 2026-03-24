const router = require("express").Router();
const { upload, cloudinary, isCloudinaryConfigured } = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

// Route to handle multiple property image uploads via Cloudinary
router.post("/images", authMiddleware, upload.array("images", 5), async (req, res) => {
    try {
        if (!isCloudinaryConfigured()) {
            return res.status(503).json({ message: "Cloudinary is not configured on the server." });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No images provided" });
        }

        // Multer-storage-cloudinary automatically handles the upload and attaches the secure_url to req.files
        const uploadedImages = req.files.map((file) => file.path); // path is the Cloudinary secure_url

        res.status(200).json({
            message: "Images uploaded successfully",
            urls: uploadedImages
        });
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        res.status(500).json({ message: "Failed to upload images to CDN" });
    }
});

module.exports = router;
