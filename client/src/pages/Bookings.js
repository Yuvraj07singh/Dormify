import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import API_URL from "../config/api";

function Bookings() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        const endpoint = user.role === "landlord" ? "/api/booking/landlord" : "/api/booking/my";

        axios.get(`${API_URL}${endpoint}`)
            .then(res => { setBookings(Array.isArray(res.data) ? res.data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [user, navigate]);

    const updateStatus = async (id, status) => {
        try {

            await axios.put(`${API_URL}/api/booking/${id}/status`, { status });
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
        } catch (err) { console.error(err); }
    };

    const statusColors = {
        pending: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
        confirmed: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
        cancelled: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
        completed: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-6">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                        {user?.role === "landlord" ? "Booking Requests" : "My Bookings"}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {user?.role === "landlord" ? "Manage booking requests for your properties" : "Track your housing bookings"}
                    </p>
                </motion.div>

                {bookings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No bookings yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Start by browsing our listings</p>
                        <button onClick={() => navigate("/listings")} className="btn-primary">Browse Listings</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking, i) => (
                            <motion.div key={booking._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Property Image */}
                                    {booking.property && (
                                        <div className="w-full md:w-48 h-36 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/property/${booking.property._id}`)}>
                                            <img src={booking.property.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"} alt={booking.property.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{booking.property?.title || "Property"}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{booking.property?.location}</p>
                                                {user?.role === "landlord" && booking.user && (
                                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                                                        Booked by: {booking.user.name} ({booking.user.email})
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${statusColors[booking.status] || statusColors.pending}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span>📅 {new Date(booking.moveInDate).toLocaleDateString()} → {new Date(booking.moveOutDate).toLocaleDateString()}</span>
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">💰 ${booking.totalAmount?.toLocaleString()}</span>
                                        </div>
                                        {booking.message && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">"{booking.message}"</p>}
                                        {/* Landlord Actions */}
                                        {user?.role === "landlord" && booking.status === "pending" && (
                                            <div className="flex gap-3 mt-4">
                                                <button onClick={() => updateStatus(booking._id, "confirmed")} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">Confirm</button>
                                                <button onClick={() => updateStatus(booking._id, "cancelled")} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Decline</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Bookings;
