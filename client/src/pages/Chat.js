import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import Footer from "../components/Footer";
import API_URL from "../config/api";

const SOCKET_URL = API_URL;

function Chat() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [typing, setTyping] = useState(null);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    // Connect to socket
    useEffect(() => {
        if (!user) return;
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on("new-message", (message) => {
            setMessages(prev => [...prev, message]);
            // Update conversation list
            setConversations(prev => prev.map(c =>
                c._id === message.conversation
                    ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
                    : c
            ));
        });

        socketRef.current.on("user-typing", (data) => {
            setTyping(data.name);
        });

        socketRef.current.on("user-stop-typing", () => {
            setTyping(null);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user]);

    // Fetch conversations
    useEffect(() => {
        if (!user) return;
        const fetchConversations = async () => {
            try {
                const res = await axios.get(`${SOCKET_URL}/api/chat/conversations`);
                setConversations(res.data);
            } catch (err) {
                console.error("Error fetching conversations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [user]);

    // Load messages when conversation is selected
    const openConversation = async (conversation) => {
        setActiveConversation(conversation);
        setLoadingMessages(true);

        // Join socket room
        socketRef.current?.emit("join-conversation", conversation._id);

        try {
            const res = await axios.get(`${SOCKET_URL}/api/chat/${conversation._id}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error("Error fetching messages", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        // Send via socket for real-time
        socketRef.current?.emit("send-message", {
            conversationId: activeConversation._id,
            senderId: user._id,
            text: newMessage
        });

        // Also stop typing
        socketRef.current?.emit("stop-typing", {
            conversationId: activeConversation._id,
            userId: user._id
        });

        setNewMessage("");
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        socketRef.current?.emit("typing", {
            conversationId: activeConversation._id,
            userId: user._id,
            name: user.name
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("stop-typing", {
                conversationId: activeConversation._id,
                userId: user._id
            });
        }, 2000);
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants?.find(p => p._id?.toString() !== user?._id?.toString());
    };

    const formatTime = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="pt-24 pb-0 px-0 md:px-6" style={{ height: "calc(100vh - 0px)" }}>
                <div className="max-w-7xl mx-auto h-full">
                    <div className="grid grid-cols-1 md:grid-cols-12 h-full rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">

                        {/* Conversations List */}
                        <div className={`md:col-span-4 lg:col-span-3 border-r border-gray-200 dark:border-slate-800 flex flex-col ${activeConversation ? "hidden md:flex" : "flex"}`}>
                            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    💬 Messages
                                    {conversations.length > 0 && (
                                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                                            {conversations.length}
                                        </span>
                                    )}
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">No conversations yet</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Visit a property and click "Chat with Landlord" to start!</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {conversations.map((conv, i) => {
                                            const other = getOtherParticipant(conv);
                                            return (
                                                <motion.div
                                                    key={conv._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => openConversation(conv)}
                                                    className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 ${activeConversation?._id === conv._id ? "bg-indigo-50 dark:bg-slate-800 border-l-4 border-l-indigo-500" : ""
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white font-bold text-sm">{other?.name?.charAt(0) || "?"}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate">{other?.name || "User"}</h4>
                                                                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                                {conv.property?.title || "Property"}
                                                            </p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                                                                {conv.lastMessage || "No messages yet"}
                                                            </p>
                                                        </div>
                                                        {conv.unreadCount > 0 && (
                                                            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={`md:col-span-8 lg:col-span-9 flex flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
                            {!activeConversation ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30"
                                        >
                                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Select a conversation</h3>
                                        <p className="text-gray-500 dark:text-gray-400">Choose from your existing conversations or start a new one</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
                                        <button
                                            onClick={() => setActiveConversation(null)}
                                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                                        >
                                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">
                                                {getOtherParticipant(activeConversation)?.name?.charAt(0) || "?"}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">
                                                {getOtherParticipant(activeConversation)?.name || "User"}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {activeConversation.property?.title || "Property"} • ₹{activeConversation.property?.price?.toLocaleString("en-IN")}/mo
                                            </p>
                                        </div>
                                        {activeConversation.property && (
                                            <button
                                                onClick={() => navigate(`/property/${activeConversation.property._id}`)}
                                                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                            >
                                                View Property
                                            </button>
                                        )}
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)" }}>
                                        {loadingMessages ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="text-center p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet. Say hello! 👋</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {messages.map((msg, i) => {
                                                    const isOwn = msg.sender?._id?.toString() === user?._id?.toString() || msg.sender?.toString() === user?._id?.toString();
                                                    return (
                                                        <motion.div
                                                            key={msg._id || i}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                                        >
                                                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isOwn
                                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md"
                                                                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-bl-md shadow-sm"
                                                                }`}>
                                                                {!isOwn && (
                                                                    <p className={`text-[10px] font-bold mb-1 ${isOwn ? "text-indigo-200" : "text-indigo-500"}`}>
                                                                        {msg.sender?.name || "User"}
                                                                    </p>
                                                                )}
                                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                                <p className={`text-[10px] mt-1 ${isOwn ? "text-indigo-200" : "text-gray-400"} text-right`}>
                                                                    {formatTime(msg.createdAt)}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                                {typing && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex justify-start"
                                                    >
                                                        <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 text-sm">
                                                            <motion.span
                                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                {typing} is typing...
                                                            </motion.span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={handleTyping}
                                            placeholder="Type your message..."
                                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </motion.button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;
