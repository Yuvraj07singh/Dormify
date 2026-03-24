import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import PropertyCard from "../components/PropertyCard";
import Footer from "../components/Footer";

function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", phone: "", bio: "", university: "" });
    const [uploadingKyc, setUploadingKyc] = useState(false);

    const isOwnProfile = currentUser?._id === id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
                const res = await axios.get(`${API_URL}/api/user/${id}`);
                setProfile(res.data.user);
                setListings(res.data.listings || []);
                setEditForm({
                    name: res.data.user.name || "",
                    phone: res.data.user.phone || "",
                    bio: res.data.user.bio || "",
                    university: res.data.user.university || ""
                });
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handleSave = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
            const res = await axios.put(`${API_URL}/api/user/profile`, editForm);
            setProfile(res.data);
            setEditing(false);
        } catch (err) {
            console.error("Error updating profile", err);
        }
    };

    const handleKycUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingKyc(true);
        try {
            const formData = new FormData();
            formData.append("images", file);

            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
            
            // Upload to Cloudinary
            const uploadRes = await axios.post(`${API_URL}/api/upload/image`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            // Submit URL to KYC endpoint
            const docUrl = uploadRes.data.urls[0];
            const kycRes = await axios.put(`${API_URL}/api/user/kyc`, { documentUrl: docUrl });
            
            setProfile({ ...profile, kycStatus: kycRes.data.kycStatus });
            alert("KYC Document submitted successfully! Awaiting Admin review.");
        } catch (err) {
            console.error("KYC Upload failed", err);
            alert("Failed to upload KYC document.");
        } finally {
            setUploadingKyc(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">User Not Found</h2>
                <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="pt-28 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Profile Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden mb-8"
                    >
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
                            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white" />
                        </div>
                        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                                <span className="text-4xl font-bold">{profile.name?.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                                    {profile.verifiedLandlord && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">✓ Verified</span>
                                    )}
                                </div>
                                <p className="text-indigo-200 capitalize mb-2">{profile.role} {profile.university && `• ${profile.university}`}</p>
                                <p className="text-indigo-100 text-sm">{profile.bio || "No bio yet."}</p>
                                <div className="flex items-center gap-4 mt-3 text-indigo-200 text-sm">
                                    {profile.phone && <span className="flex items-center gap-1">📞 {profile.phone}</span>}
                                    {profile.responseTime && <span className="flex items-center gap-1">⏱️ {profile.responseTime}</span>}
                                    <span className="flex items-center gap-1">📅 Joined {new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                                </div>
                            </div>
                            {isOwnProfile && (
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-sm font-semibold"
                                >
                                    {editing ? "Cancel" : "✏️ Edit Profile"}
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Edit Form */}
                    {editing && isOwnProfile && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl mb-8"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University</label>
                                    <input type="text" value={editForm.university} onChange={e => setEditForm({ ...editForm, university: e.target.value })} className="input-field" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="input-field h-24 resize-none" placeholder="Tell us about yourself..." />
                                </div>
                            </div>
                            <button onClick={handleSave} className="btn-primary mt-4">Save Changes</button>
                        </motion.div>
                    )}

                    {/* Stats */}
                    {profile.role === "landlord" && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: "Listings", value: listings.length, icon: "🏠" },
                                    { label: "Response", value: profile.responseTime || "—", icon: "⏱️" },
                                    { label: "KYC Status", value: profile.kycStatus === "verified" ? "Verified" : profile.kycStatus || "Unverified", icon: "🛡️" },
                                    { label: "Role", value: "Landlord", icon: "👤" }
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-center shadow-sm"
                                    >
                                        <span className="text-2xl">{stat.icon}</span>
                                        <p className={`mt-2 text-lg font-bold ${stat.value === "Verified" ? "text-emerald-500" : stat.value === "rejected" ? "text-red-500" : "text-gray-800 dark:text-white"}`}>{stat.value}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* KYC Upload Banner (Only show if own profile and not verified) */}
                            {isOwnProfile && profile.kycStatus !== "verified" && profile.kycStatus !== "pending" && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mb-8 p-6 rounded-3xl bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Identity Verification Required</h3>
                                        <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1 max-w-xl">
                                            To build trust and protect students, you must upload your Government ID (Aadhaar/PAN) or Property Ownership proof before your listings can be booked.
                                        </p>
                                        {profile.kycStatus === "rejected" && (
                                            <p className="text-sm text-red-600 font-bold mt-2">
                                                Rejection Reason: {profile.kycRejectionReason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0 relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleKycUpload}
                                            disabled={uploadingKyc}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <button disabled={uploadingKyc} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors shadow-lg shadow-amber-500/30 w-full md:w-auto">
                                            {uploadingKyc ? "Uploading securely..." : "Upload Secure ID"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Pending State Banner */}
                            {isOwnProfile && profile.kycStatus === "pending" && (
                                <div className="mb-8 p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-indigo-500 flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-400">Identity Verification Pending</h3>
                                        <p className="text-sm text-indigo-700 dark:text-indigo-500/80 mt-1">
                                            Our administration team is currently reviewing your identity documents. This usually takes 24-48 hours.
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin shrink-0"></div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Listings */}
                    {listings.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                {isOwnProfile ? "Your Listings" : `${profile.name}'s Listings`}
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((p, i) => (
                                    <motion.div
                                        key={p._id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <PropertyCard {...p} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Profile;
