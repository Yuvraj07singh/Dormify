import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Footer from "../components/Footer";
import API_URL from "../config/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const LIFESTYLE_OPTIONS = {
    sleepSchedule: [
        { value: "early-bird", label: "Early Bird", icon: "🌅" },
        { value: "night-owl", label: "Night Owl", icon: "🦉" },
        { value: "flexible", label: "Flexible", icon: "⏰" },
    ],
    diet: [
        { value: "veg", label: "Vegetarian", icon: "🥗" },
        { value: "non-veg", label: "Non-Veg", icon: "🍗" },
        { value: "vegan", label: "Vegan", icon: "🌱" },
        { value: "any", label: "No Preference", icon: "🍽️" },
    ],
    cleanliness: [
        { value: "very-clean", label: "Very Clean", icon: "✨" },
        { value: "average", label: "Average", icon: "🧹" },
        { value: "relaxed", label: "Relaxed", icon: "😌" },
    ],
    studyHabits: [
        { value: "quiet-studious", label: "Quiet & Studious", icon: "📚" },
        { value: "social", label: "Social", icon: "🎉" },
        { value: "balanced", label: "Balanced", icon: "⚖️" },
    ],
};

const DURATION_OPTIONS = [
    { value: "1-3 months", label: "1-3 Months" },
    { value: "3-6 months", label: "3-6 Months" },
    { value: "6-12 months", label: "6-12 Months" },
    { value: "1+ year", label: "1+ Year" },
    { value: "flexible", label: "Flexible" },
];

// Compatibility score calculation
function getCompatibility(myProfile, otherProfile) {
    if (!myProfile || !otherProfile) return null;
    let score = 0, total = 0;

    // Budget overlap (within 30% of each other)
    total += 20;
    const budgetDiff = Math.abs(myProfile.budget - otherProfile.budget);
    const avgBudget = (myProfile.budget + otherProfile.budget) / 2;
    if (budgetDiff / avgBudget < 0.15) score += 20;
    else if (budgetDiff / avgBudget < 0.30) score += 12;
    else if (budgetDiff / avgBudget < 0.50) score += 5;

    // City match
    total += 25;
    if (myProfile.city?.toLowerCase() === otherProfile.city?.toLowerCase()) score += 25;

    // Gender preference compatibility
    total += 10;
    if (myProfile.genderPref === "any" || otherProfile.genderPref === "any" || myProfile.genderPref === otherProfile.genderPref) score += 10;

    // Lifestyle matches
    const ls1 = myProfile.lifestyle || {};
    const ls2 = otherProfile.lifestyle || {};

    total += 10;
    if (ls1.sleepSchedule === ls2.sleepSchedule || ls1.sleepSchedule === "flexible" || ls2.sleepSchedule === "flexible") score += 10;

    total += 10;
    if (ls1.diet === ls2.diet || ls1.diet === "any" || ls2.diet === "any") score += 10;

    total += 10;
    if (ls1.cleanliness === ls2.cleanliness) score += 10;
    else if (Math.abs(["very-clean", "average", "relaxed"].indexOf(ls1.cleanliness) - ["very-clean", "average", "relaxed"].indexOf(ls2.cleanliness)) === 1) score += 5;

    total += 5;
    if (ls1.smoking === ls2.smoking) score += 5;

    total += 10;
    if (ls1.studyHabits === ls2.studyHabits || ls1.studyHabits === "balanced" || ls2.studyHabits === "balanced") score += 10;

    return Math.round((score / total) * 100);
}

function CompatBadge({ score }) {
    if (score === null) return null;
    const color = score >= 80 ? "emerald" : score >= 60 ? "amber" : "gray";
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-${color}-100 dark:bg-${color}-500/20 text-${color}-700 dark:text-${color}-400`}>
            {score}% Match
        </span>
    );
}

function ChipSelect({ options, value, onChange, label }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            value === opt.value
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
                        }`}
                    >
                        <span>{opt.icon}</span> {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ProfileCard({ profile, myProfile, onMessage }) {
    const u = profile.user || {};
    const ls = profile.lifestyle || {};
    const compat = getCompatibility(myProfile, profile);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
        >
            <div className="p-5 md:p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20 shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{u.name || "Anonymous"}</h3>
                            {compat !== null && <CompatBadge score={compat} />}
                        </div>
                        {u.university && <p className="text-xs text-indigo-500 font-semibold">{u.university}</p>}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.city}{profile.area ? ` · ${profile.area}` : ""}</p>
                    </div>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Budget</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">₹{profile.budget?.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Duration</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{profile.duration || "Flexible"}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pref</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5 capitalize">{profile.genderPref || "Any"}</p>
                    </div>
                </div>

                {/* Lifestyle Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {ls.sleepSchedule && ls.sleepSchedule !== "flexible" && (
                        <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                            {ls.sleepSchedule === "early-bird" ? "🌅 Early Bird" : "🦉 Night Owl"}
                        </span>
                    )}
                    {ls.diet && ls.diet !== "any" && (
                        <span className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold capitalize">
                            {ls.diet === "veg" ? "🥗 Veg" : ls.diet === "vegan" ? "🌱 Vegan" : "🍗 Non-Veg"}
                        </span>
                    )}
                    {ls.cleanliness === "very-clean" && (
                        <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold">✨ Very Clean</span>
                    )}
                    {ls.smoking && (
                        <span className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">🚬 Smoker</span>
                    )}
                    {!ls.smoking && (
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">🚭 Non-Smoker</span>
                    )}
                    {ls.workFromHome && (
                        <span className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-semibold">💻 WFH</span>
                    )}
                    {ls.studyHabits && ls.studyHabits !== "balanced" && (
                        <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                            {ls.studyHabits === "quiet-studious" ? "📚 Studious" : "🎉 Social"}
                        </span>
                    )}
                </div>

                {/* About */}
                {profile.about && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic line-clamp-2">"{profile.about}"</p>
                )}
                {profile.lookingFor && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Looking for: <span className="font-semibold text-gray-700 dark:text-gray-300">{profile.lookingFor}</span></p>
                )}

                {/* Action */}
                <Link to="/chat" className="block w-full text-center py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:opacity-90 transition-all shadow-sm">
                    Send Message
                </Link>
            </div>
        </motion.div>
    );
}

export default function RoommateFinder() {
    const { user } = useContext(AuthContext);
    const [tab, setTab] = useState("browse"); // browse | create
    const [profiles, setProfiles] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterCity, setFilterCity] = useState("");

    // Form state
    const [form, setForm] = useState({
        city: "", area: "", budget: "", duration: "flexible",
        genderPref: "any", about: "", lookingFor: "",
        lifestyle: {
            sleepSchedule: "flexible", diet: "any", cleanliness: "average",
            smoking: false, pets: false, studyHabits: "balanced", workFromHome: false,
        },
    });

    useEffect(() => {
        loadProfiles();
        if (user) loadMyProfile();
    }, [user]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/roommate`;
            if (filterCity) url += `?city=${encodeURIComponent(filterCity)}`;
            const res = await axios.get(url);
            setProfiles(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadMyProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/roommate/mine`);
            if (res.data.data) {
                setMyProfile(res.data.data);
                setForm({
                    city: res.data.data.city || "",
                    area: res.data.data.area || "",
                    budget: res.data.data.budget || "",
                    duration: res.data.data.duration || "flexible",
                    genderPref: res.data.data.genderPref || "any",
                    about: res.data.data.about || "",
                    lookingFor: res.data.data.lookingFor || "",
                    lifestyle: { ...form.lifestyle, ...(res.data.data.lifestyle || {}) },
                });
            }
        } catch (e) { /* no profile yet */ }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.city || !form.budget) { toast.error("City and budget are required"); return; }
        try {
            const res = await axios.post(`${API_URL}/api/roommate`, {
                ...form,
                budget: Number(form.budget),
            });
            setMyProfile(res.data.data);
            toast.success(myProfile ? "Profile updated!" : "Profile created! You're now visible to potential roommates.");
            setTab("browse");
            loadProfiles();
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to save profile");
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_URL}/api/roommate`);
            setMyProfile(null);
            toast.success("Profile deactivated");
            loadProfiles();
        } catch { toast.error("Failed to deactivate"); }
    };

    const updateLifestyle = (key, value) => {
        setForm(prev => ({ ...prev, lifestyle: { ...prev.lifestyle, [key]: value } }));
    };

    // Filter profiles excluding self
    const displayProfiles = profiles.filter(p => p.user?._id !== user?._id);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Hero */}
            <div className="pt-24 pb-8 px-4 md:px-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-white dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-950">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 mb-6">
                            <span className="text-lg">🤝</span>
                            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Exclusive to Dormify</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 dark:text-white leading-tight">
                            Find Your <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Perfect Roommate</span>
                        </h1>
                        <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Match with compatible students based on lifestyle, budget, and preferences.
                            Split rent, save money, make friends.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pb-24">
                {/* Tab + Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl">
                        <button onClick={() => setTab("browse")}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "browse" ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                            Browse ({displayProfiles.length})
                        </button>
                        <button onClick={() => { if (!user) { toast.error("Sign in to create a profile"); return; } setTab("create"); }}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "create" ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md" : "text-gray-500 dark:text-gray-400"}`}>
                            {myProfile ? "Edit Profile" : "Create Profile"}
                        </button>
                    </div>

                    {tab === "browse" && (
                        <div className="flex gap-2">
                            <input
                                type="text" placeholder="Filter by city..." value={filterCity}
                                onChange={e => setFilterCity(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && loadProfiles()}
                                className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-48"
                            />
                            <button onClick={loadProfiles} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 transition-all">
                                Search
                            </button>
                        </div>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {tab === "browse" ? (
                        <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                                </div>
                            ) : displayProfiles.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl py-20 text-center border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
                                    <p className="text-xl font-bold text-gray-800 dark:text-white mb-2">No roommate profiles yet</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Be the first to create a profile and start matching!</p>
                                    <button onClick={() => { if (!user) { toast.error("Sign in first"); return; } setTab("create"); }}
                                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all">
                                        Create My Profile
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {displayProfiles.map(p => (
                                        <ProfileCard key={p._id} profile={p} myProfile={myProfile} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl p-6 md:p-10 space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                        {myProfile ? "Update Your Profile" : "Create Roommate Profile"}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fill in your preferences so we can find the best match for you.</p>
                                </div>

                                {/* Basic Info */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                                        <input type="text" required value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                                            placeholder="e.g. Bangalore" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Area / Locality</label>
                                        <input type="text" value={form.area} onChange={e => setForm({...form, area: e.target.value})}
                                            placeholder="e.g. Koramangala" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Budget (₹) *</label>
                                        <input type="number" required min="1000" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})}
                                            placeholder="e.g. 8000" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration</label>
                                        <select value={form.duration} onChange={e => setForm({...form, duration: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium">
                                            {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Gender Pref */}
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Roommate Gender Preference</p>
                                    <div className="flex gap-2">
                                        {["any", "male", "female"].map(g => (
                                            <button key={g} type="button" onClick={() => setForm({...form, genderPref: g})}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border ${
                                                    form.genderPref === g
                                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                                        : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300"
                                                }`}>
                                                {g === "any" ? "No Preference" : g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lifestyle */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-sm">🎭</span>
                                        Lifestyle
                                    </h3>
                                    <ChipSelect label="Sleep Schedule" options={LIFESTYLE_OPTIONS.sleepSchedule} value={form.lifestyle.sleepSchedule} onChange={v => updateLifestyle("sleepSchedule", v)} />
                                    <ChipSelect label="Diet" options={LIFESTYLE_OPTIONS.diet} value={form.lifestyle.diet} onChange={v => updateLifestyle("diet", v)} />
                                    <ChipSelect label="Cleanliness" options={LIFESTYLE_OPTIONS.cleanliness} value={form.lifestyle.cleanliness} onChange={v => updateLifestyle("cleanliness", v)} />
                                    <ChipSelect label="Study Style" options={LIFESTYLE_OPTIONS.studyHabits} value={form.lifestyle.studyHabits} onChange={v => updateLifestyle("studyHabits", v)} />

                                    <div className="flex flex-wrap gap-6">
                                        {[
                                            { key: "smoking", label: "Smoker", icon: "🚬" },
                                            { key: "pets", label: "Has Pets", icon: "🐾" },
                                            { key: "workFromHome", label: "Work from Home", icon: "💻" },
                                        ].map(toggle => (
                                            <label key={toggle.key} className="flex items-center gap-3 cursor-pointer" onClick={() => updateLifestyle(toggle.key, !form.lifestyle[toggle.key])}>
                                                <div className={`w-10 h-6 rounded-full px-1 flex items-center transition-colors duration-300 ${form.lifestyle[toggle.key] ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"}`}>
                                                    <motion.div animate={{ x: form.lifestyle[toggle.key] ? 16 : 0 }} className="w-4 h-4 rounded-full bg-white shadow-md" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{toggle.icon} {toggle.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* About */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About You</label>
                                        <textarea value={form.about} onChange={e => setForm({...form, about: e.target.value})} maxLength={400}
                                            placeholder="Tell potential roommates about yourself..." rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium resize-none" />
                                        <p className="text-[10px] text-gray-400 mt-1">{form.about.length}/400</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What You're Looking For</label>
                                        <textarea value={form.lookingFor} onChange={e => setForm({...form, lookingFor: e.target.value})} maxLength={200}
                                            placeholder="Describe your ideal roommate..." rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium resize-none" />
                                        <p className="text-[10px] text-gray-400 mt-1">{form.lookingFor.length}/200</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
                                    >
                                        {myProfile ? "Update Profile" : "Create Profile"}
                                    </motion.button>
                                    {myProfile && (
                                        <button type="button" onClick={handleDelete}
                                            className="px-6 py-4 rounded-2xl border-2 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                            Deactivate
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
}
