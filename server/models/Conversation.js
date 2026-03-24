const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true
    },
    lastMessage: {
        type: String,
        default: ""
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to prevent duplicate conversations
conversationSchema.index({ participants: 1, property: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
