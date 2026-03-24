const router = require("express").Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/authMiddleware");

// START OR GET EXISTING CONVERSATION
router.post("/start", authMiddleware, async (req, res) => {
    try {
        const { landlordId, propertyId } = req.body;
        const studentId = req.user.id;

        if (studentId === landlordId) {
            return res.status(400).json({ message: "Cannot start a conversation with yourself" });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [studentId, landlordId] },
            property: propertyId
        })
        .populate("participants", "name email avatar role")
        .populate("property", "title images price location");

        if (conversation) {
            return res.json(conversation);
        }

        // Create new conversation
        conversation = new Conversation({
            participants: [studentId, landlordId],
            property: propertyId
        });
        await conversation.save();

        conversation = await Conversation.findById(conversation._id)
            .populate("participants", "name email avatar role")
            .populate("property", "title images price location");

        res.status(201).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET ALL CONVERSATIONS FOR CURRENT USER
router.get("/conversations", authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate("participants", "name email avatar role")
        .populate("property", "title images price location")
        .sort({ lastMessageAt: -1 });

        // Get unread counts for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: req.user.id },
                    read: false
                });
                return { ...conv.toObject(), unreadCount };
            })
        );

        res.json(conversationsWithUnread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET MESSAGES FOR A CONVERSATION
router.get("/:conversationId/messages", authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        // Verify user is a participant (ObjectId comparison needs string conversion)
        const participantIds = conversation.participants.map(p => p.toString());
        if (!participantIds.includes(req.user.id.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const messages = await Message.find({ conversation: req.params.conversationId })
            .populate("sender", "name avatar role")
            .sort({ createdAt: 1 });

        // Mark received messages as read
        await Message.updateMany(
            {
                conversation: req.params.conversationId,
                sender: { $ne: req.user.id },
                read: false
            },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SEND A MESSAGE
router.post("/:conversationId/message", authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        const participantIds2 = conversation.participants.map(p => p.toString());
        if (!participantIds2.includes(req.user.id.toString())) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const message = new Message({
            conversation: req.params.conversationId,
            sender: req.user.id,
            text: req.body.text
        });
        await message.save();

        // Update conversation's last message
        conversation.lastMessage = req.body.text;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populated = await Message.findById(message._id)
            .populate("sender", "name avatar role");

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
