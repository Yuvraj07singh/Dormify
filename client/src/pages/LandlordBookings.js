import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import API_URL from "../config/api";

const API = API_URL;

const statusColors = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
    confirmed: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
    cancelled: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" },
    completed: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" }
};

function BookingCard({ booking, onAction }) {
    const [acting, setActing] = useState(false);
    const sc = statusColors[booking.status] || statusColors.pending;
    
    // Calculate total duration roughly in months
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
        >
            {/* Top Banner section */}
            <div className="relative p-5 md:p-6 flex gap-4 md:gap-5 items-start border-b border-gray-50 dark:border-slate-800/50">
                <img src={booking.property?.images?.[0] || `https://picsum.photos/seed/${booking._id}/200/100`}
                    alt="" className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="text-gray-900 dark:text-white font-bold text-lg truncate">{booking.property?.title || "Property"}</h3>
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border} shrink-0`}>
                            {booking.status?.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{booking.property?.city}</p>
                    
                    <div className="flex items-center gap-1.5 mt-2.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px] shrink-0">
                            {booking.user?.name?.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{booking.user?.name} {booking.user?.university ? `· ${booking.user.university}` : ""}</span>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 bg-gray-50/50 dark:bg-slate-900/30">
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Move-in</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">{new Date(booking.moveInDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Duration</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">{months} mo</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-center">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Total</p>
                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mt-1">₹{(booking.totalAmount || booking.property?.price * months)?.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-5">
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 ${booking.paymentStatus === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                        {booking.paymentStatus === "completed" ? "💳 Payment Recv'd" : "⏳ Pending Pmt"}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">ID: {booking._id.slice(-6).toUpperCase()}</span>
                </div>

                {/* Action Buttons */}
                {booking.status === "pending" && (
                    <div className="flex gap-3">
                        <button onClick={() => handleStatus("confirmed")} disabled={acting}
                            className="flex-1 py-3 justify-center rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50">
                            {acting ? "..." : "Approve 🚀"}
                        </button>
                        <button onClick={() => handleStatus("cancelled")} disabled={acting}
                            className="flex-1 py-3 justify-center rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50">
                            {acting ? "..." : "Decline"}
                        </button>
                    </div>
                )}
                {booking.status === "confirmed" && (
                    <button onClick={() => handleStatus("completed")} disabled={acting}
                        className="w-full py-3 justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50">
                        {acting ? "..." : "Mark as Completed ✅"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// CSS-based Chart Bar
const ChartBar = ({ height, label }) => (
    <div className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer">
        <div className="w-8 md:w-12 bg-indigo-100 dark:bg-slate-800 rounded-lg relative overflow-hidden transition-all duration-500" style={{ height: '100%' }}>
            <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: `${height}%` }} 
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-lg group-hover:opacity-80 transition-opacity"
            />
        </div>
        <span className="text-[10px] md:text-xs font-semibold text-gray-500">{label}</span>
    </div>
);

export default function LandlordDashboard() {
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
        } catch { toast.error("Failed to load dashboard data"); }
        finally { setLoading(false); }
    };

    const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
    const counts = { all: bookings.length, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    let totalRevenue = 0;
    let pendingRequests = 0;

    bookings.forEach(b => { 
        if (counts[b.status] !== undefined) counts[b.status]++; 
        if (b.status === "confirmed" || b.status === "completed") {
            const months = b.moveInDate && b.moveOutDate ? Math.max(1, Math.ceil((new Date(b.moveOutDate) - new Date(b.moveInDate)) / (1000 * 60 * 60 * 24 * 30))) : 1;
            totalRevenue += (b.totalAmount || (b.property?.price * months) || 0);
        }
        if (b.status === "pending") pendingRequests++;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-24 px-4 pb-20">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">🚀 Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">Welcome back, {user?.name}. Here's your property overview.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
                    <div className="col-span-2 bg-gradient-to-br from-gray-900 to-black dark:from-slate-900 dark:to-slate-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-black/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <p className="text-gray-400 text-sm font-semibold tracking-wide uppercase mb-2 relative z-10">Total Revenue</p>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight relative z-10">₹{totalRevenue.toLocaleString("en-IN")}</h2>
                        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold relative z-10">
                            <span className="bg-emerald-400/20 px-2 py-1 rounded-lg">+14.5%</span> from last month
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Bookings</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{counts.all}</h2>
                        <div className="absolute -bottom-4 -right-4 text-7xl opacity-5">📋</div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Requests</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-amber-500">{pendingRequests}</h2>
                        <div className="absolute -bottom-4 -right-4 text-7xl opacity-5">⏳</div>
                    </div>
                </div>

                {/* Charts Area */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-10 overflow-hidden">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months performance</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-600 dark:text-gray-300">Monthly</span>
                    </div>
                    {/* Pure CSS Chart */}
                    <div className="h-48 md:h-64 flex items-end justify-between md:justify-around px-2 pt-4 border-b border-gray-100 dark:border-slate-800 pb-2">
                        <ChartBar height={40} label="Oct" />
                        <ChartBar height={60} label="Nov" />
                        <ChartBar height={35} label="Dec" />
                        <ChartBar height={80} label="Jan" />
                        <ChartBar height={65} label="Feb" />
                        <ChartBar height={95} label="Mar" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Bookings</h2>
                    
                    {/* Filter Pills */}
                    <div className="flex gap-2 flex-wrap bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        {Object.keys(counts).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold capitalize transition-all ${filter === f ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}>
                                {f} <span className="ml-[2px] opacity-70 font-medium">({counts[f]})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl py-24 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">No {filter !== "all" ? filter : ""} bookings yet</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">When students book your properties, they'll appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        <AnimatePresence>
                            {filtered.map(b => (
                                <BookingCard key={b._id} booking={b} onAction={load} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
