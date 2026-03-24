const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dormify").then(async () => {
    try {
        await mongoose.connection.db.dropCollection("properties");
        console.log("Successfully dropped legacy properties collection to clear bad indexes.");
    } catch (e) {
        console.log("Collection already dropped or error:", e.message);
    }
    process.exit(0);
});
