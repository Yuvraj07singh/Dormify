import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

function StatCard({ label, value, icon, color, sub }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${color} opacity-10 -translate-y-8 translate-x-8`} />
            <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 flex items-center justify-center text-2xl mb-4`}>
                {icon}
            </div>
            <p className="text-gray-400 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value?.toLocaleString() ?? "—"}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </motion.div>
    );
}

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        if (user.role !== "admin") { navigate("/"); return; }
        loadAll();
    }, [user]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, propsRes, booksRes] = await Promise.all([
                axios.get(`${API}/api/admin/stats`),
                axios.get(`${API}/api/admin/users?limit=50`),
                axios.get(`${API}/api/admin/properties?limit=50`),
                axios.get(`${API}/api/admin/bookings?limit=50`)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.data || []);
            setProperties(propsRes.data.data || []);
            setBookings(booksRes.data.data || []);
        } catch (err) {
            console.error("Admin load error", err);
            toast.error("Failed to load admin data");
        }
        setLoading(false);
    };

    const handleKyc = async (userId, docUrl, currentStatus) => {
        if (currentStatus !== "pending") return;
        
        // Show the document to admin
        window.open(docUrl, '_blank');
        
        const action = window.prompt("Type 'approve' to verify, or type a rejection reason to reject:");
        if (!action) return;

        try {
            const status = action.toLowerCase() === 'approve' ? 'verified' : 'rejected';
            const reason = status === 'rejected' ? action : '';
            
            await axios.put(`${API}/api/admin/kyc/${userId}`, { status, reason });
            toast.success(`KYC ${status}`);
            loadAll();
        } catch (err) {
            toast.error("Failed to update KYC");
        }
    };

    const handleBanUser = async (userId, isBanned) => {
        try {
            await axios.put(`${API}/api/admin/user/${userId}`, { isBanned: !isBanned });
            toast.success(isBanned ? "User unbanned" : "User banned");
            loadAll();
        } catch { toast.error("Action failed"); }
    };

    const handleVerifyProperty = async (propertyId, isVerified) => {
        try {
            await axios.put(`${API}/api/admin/property/${propertyId}/verify`, { isVerified: !isVerified });
            toast.success(isVerified ? "Verification removed" : "Property verified ✅");
            loadAll();
        } catch { toast.error("Action failed"); }
    };

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm("Permanently delete this property?")) return;
        try {
            await axios.delete(`${API}/api/admin/property/${propertyId}`);
            toast.success("Property deleted");
            loadAll();
        } catch { toast.error("Delete failed"); }
    };

    // Build mock monthly trend data from bookings
    const monthlyData = (() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const counts = new Array(12).fill(0);
        bookings.forEach(b => {
            const m = new Date(b.createdAt).getMonth();
            counts[m]++;
        });
        return months.map((m, i) => ({ month: m, bookings: counts[i], revenue: counts[i] * 8000 }));
    })();

    const pieData = [
        { name: "Students", value: stats?.users?.students || 0 },
        { name: "Landlords", value: stats?.users?.landlords || 0 },
    ];

    const tabs = ["overview", "users", "properties", "bookings"];

    return (
        <div className="min-h-screen bg-slate-950 pt-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">🔑 Admin Dashboard</h1>
                        <p className="text-gray-400 mt-1">Platform Command Center · Dormify v2.0</p>
                    </div>
                    <button onClick={loadAll} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                        ↻ Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 p-1 bg-slate-900 rounded-2xl w-fit border border-slate-800">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {tab === "overview" && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Users" value={stats?.users?.total} icon="👥" color="bg-indigo-500" sub={`${stats?.users?.students} students, ${stats?.users?.landlords} landlords`} />
                                    <StatCard label="Total Properties" value={stats?.properties?.total} icon="🏠" color="bg-emerald-500" />
                                    <StatCard label="Total Bookings" value={stats?.bookings?.total} icon="📅" color="bg-amber-500" sub={`${stats?.bookings?.confirmed} confirmed, ${stats?.bookings?.pending} pending`} />
                                    <StatCard label="Total Revenue" value={`₹${(stats?.revenue?.total || 0).toLocaleString()}`} icon="💰" color="bg-pink-500" sub="From paid bookings" />
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-6">Monthly Bookings & Revenue</h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <AreaChart data={monthlyData}>
                                                <defs>
                                                    <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                                                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f1f5f9" }} />
                                                <Area type="monotone" dataKey="bookings" stroke="#6366f1" fill="url(#bookGrad)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-6">User Distribution</h3>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#f1f5f9" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex gap-4 justify-center mt-2">
                                            {pieData.map((d, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-sm text-gray-400">
                                                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                                                    {d.name}: <span className="text-white font-bold">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Bookings */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4">Recent Bookings</h3>
                                    <div className="space-y-3">
                                        {bookings.slice(0, 5).map(b => (
                                            <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{b.property?.title || "Unknown Property"}</p>
                                                    <p className="text-gray-400 text-xs">{b.user?.name} · {new Date(b.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : b.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                                                        {b.status}
                                                    </span>
                                                    <p className="text-white font-bold text-sm mt-1">₹{(b.totalAmount || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USERS TAB */}
                        {tab === "users" && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="text-white font-bold">All Users ({users.length})</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800">
                                                {["Name", "Email", "Role", "KYC", "Status", "Actions"].map(h => (
                                                    <th key={h} className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {users.map(u => (
                                                <tr key={u._id} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white font-bold shrink-0">
                                                                {u.name?.charAt(0)}
                                                            </div>
                                                            <span className="text-white font-medium text-sm">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${u.role === "admin" ? "bg-purple-500/20 text-purple-400" : u.role === "landlord" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.role === "landlord" ? (
                                                            u.kycStatus === "pending" ? (
                                                                <button onClick={() => handleKyc(u._id, u.kycDocumentUrl, u.kycStatus)} className="text-xs px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors cursor-pointer font-bold">Review KYC</button>
                                                            ) : (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.kycStatus === "verified" ? "bg-emerald-500/20 text-emerald-400" : u.kycStatus === "rejected" ? "bg-red-500/20 text-red-400" : "bg-gray-500/20 text-gray-400"}`}>
                                                                    {u.kycStatus || "unverified"}
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isBanned ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                                                            {u.isBanned ? "Banned" : "Active"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 flex gap-2">
                                                        {u.role !== "admin" && (
                                                            <button onClick={() => handleBanUser(u._id, u.isBanned)}
                                                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isBanned ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}>
                                                                {u.isBanned ? "Unban" : "Ban"}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PROPERTIES TAB */}
                        {tab === "properties" && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="text-white font-bold">All Properties ({properties.length})</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800">
                                                {["Property", "City", "Price", "Views", "Status", "Actions"].map(h => (
                                                    <th key={h} className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {properties.map(p => (
                                                <tr key={p._id} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img src={p.images?.[0] || "https://picsum.photos/seed/prop/48/48"} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                            <div>
                                                                <p className="text-white font-medium text-sm line-clamp-1">{p.title}</p>
                                                                <p className="text-gray-400 text-xs">{p.owner?.name || "Unknown"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{p.city}</td>
                                                    <td className="px-6 py-4 text-white font-semibold text-sm">₹{p.price?.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">👁️ {p.viewCount || 0}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isVerified ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                                            {p.isVerified ? "✅ Verified" : "⏳ Pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleVerifyProperty(p._id, p.isVerified)}
                                                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${p.isVerified ? "bg-slate-700 text-gray-400 hover:bg-slate-600" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"}`}>
                                                                {p.isVerified ? "Unverify" : "Verify"}
                                                            </button>
                                                            <button onClick={() => handleDeleteProperty(p._id)}
                                                                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* BOOKINGS TAB */}
                        {tab === "bookings" && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <h3 className="text-white font-bold">All Bookings ({bookings.length})</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800">
                                                {["Property", "Tenant", "Dates", "Amount", "Payment", "Status"].map(h => (
                                                    <th key={h} className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {bookings.map(b => (
                                                <tr key={b._id} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 text-white text-sm font-medium">{b.property?.title || "—"}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-sm">{b.user?.name || "—"}</td>
                                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                                        {b.moveInDate ? new Date(b.moveInDate).toLocaleDateString() : "—"} →{" "}
                                                        {b.moveOutDate ? new Date(b.moveOutDate).toLocaleDateString() : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-white font-bold text-sm">₹{(b.totalAmount || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.paymentStatus === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                                                            {b.paymentStatus || "pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${b.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : b.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
