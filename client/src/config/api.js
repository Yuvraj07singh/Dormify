// Centralized API configuration
// In production (Vercel), set REACT_APP_API_URL to your backend URL (e.g. https://dormify-sbxg.onrender.com)
// In development, it defaults to http://localhost:5000

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_URL;
