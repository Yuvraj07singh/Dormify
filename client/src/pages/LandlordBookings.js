import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_URL from "../config/api";

const API = API_URL;

const statusColors = {
    pending: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
    confirmed: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
    cancelled: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
    completed: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" }
};

function BookingCard({ booking, onAction }) {
    const [acting, setActing] = useState(false);
    const sc = statusColors[booking.status] || statusColors.pending;
    const months = booking.moveInDate && booking.moveOutDate
        ? Math.max(1, Math.ceil((new Date(booking.moveOutDate) - new Date(booking.moveInDate)) / (1000 * 60 * 60 * 24 * 30)))
        : 1;

    const handleStatus = async (status) => {
        setActing(true);
        try {
            await axios.put(`${API}/api/booking/${booking._id}/status`, { status });
            toast.success(`Booking ${status}!`);
            onAction();
        } catch { toast.error("Action failed"); }
        finally { setActing(false); }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-lg overflow-hidden"
        >
            {/* Property Banner */}
            <div className="relative h-28 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center px-6 gap-4">
                <img src={booking.property?.images?.[0] || `https://picsum.photos/seed/${booking._id}/200/100`}
                    alt="" className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/20 shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold truncate">{booking.property?.title || "Property"}</h3>
                    <p className="text-indigo-200 text-sm">{booking.property?.city}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                    {booking.status?.toUpperCase()}
                </span>
            </div>

            {/* Body */}
            <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                        {booking.user?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{booking.user?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{booking.user?.email}</p>
                        {booking.user?.university && <p className="text-xs text-indigo-500 mt-0.5 font-medium">🎓 {booking.user.university}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Move-in</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{new Date(booking.moveInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-gray-50 dark:bg-slate-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{months} mo</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                        <p className="text-xs text-indigo-500">Total</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">₹{(booking.totalAmount || booking.property?.price * months)?.toLocaleString()}</p>
                    </div>
                </div>

                {booking.message && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 mb-4 text-sm text-gray-600 dark:text-gray-300 italic">
                        "{booking.message}"
                    </div>
                )}

                {/* Payment Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.paymentStatus === "completed" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
                        {booking.paymentStatus === "completed" ? "✅ Payment Received" : "⏳ Payment Pending"}
                    </span>
                </div>

                {/* Action Buttons */}
                {booking.status === "pending" && (
                    <div className="flex gap-2">
                        <button onClick={() => handleStatus("confirmed")} disabled={acting}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
                            {acting ? "..." : "✅ Accept"}
                        </button>
                        <button onClick={() => handleStatus("cancelled")} disabled={acting}
                            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-all disabled:opacity-50">
                            {acting ? "..." : "❌ Decline"}
                        </button>
                    </div>
                )}
                {booking.status === "confirmed" && (
                    <button onClick={() => handleStatus("completed")} disabled={acting}
                        className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50">
                        {acting ? "..." : "Mark as Completed"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export default function LandlordBookings() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        if (user.role !== "landlord" && user.role !== "admin") { navigate("/"); return; }
        load();
    }, [user]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/booking/landlord?limit=100`);
            setBookings(res.data.data || res.data || []);
        } catch { toast.error("Failed to load bookings"); }
        finally { setLoading(false); }
    };

    const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
    const counts = { all: bookings.length, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    bookings.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-24 px-4 pb-16">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Booking Manager</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage all your incoming booking requests</p>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {Object.keys(counts).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-indigo-400"}`}>
                            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <p className="text-5xl mb-4">📭</p>
                        <p className="text-xl font-semibold">No {filter !== "all" ? filter : ""} bookings found</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filtered.map(b => (
                                <BookingCard key={b._id} booking={b} onAction={load} />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
