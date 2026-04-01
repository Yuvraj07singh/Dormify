import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Footer from "../components/Footer";
import API_URL from "../config/api";

const TIPS = [
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, title: "Cook at home", desc: "Save ₹3,000–₹5,000/month vs eating out daily." },
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>, title: "Use public transport", desc: "Living near a bus/metro stop cuts commute cost by 60%." },
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, title: "Share with a roommate", desc: "Split rent and utilities to halve your housing cost." },
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>, title: "Negotiate WiFi", desc: "Ask landlord to include WiFi in rent — saves ₹500–₹800/mo." },
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: "Monitor utilities", desc: "Furnished PGs include electricity — prioritize them." },
    { icon: <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, title: "Move off-peak", desc: "Moving Nov–Jan gets you 15–20% cheaper rents." },
];

const CITY_AVERAGES = {
    "Mumbai": 18000, "Delhi": 12000, "Bangalore": 14000, "Hyderabad": 11000,
    "Pune": 10000, "Chennai": 9000, "Kolkata": 8000, "Ahmedabad": 7000,
    "Jaipur": 6000, "Lucknow": 5500, "Other": 8000
};

// Animated radial gauge component
function Gauge({ percent, color }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
        <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" className="dark:stroke-slate-700" />
            <motion.circle
                cx="70" cy="70" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ transformOrigin: "70px 70px", transform: "rotate(-90deg)" }}
            />
            <text x="70" y="65" textAnchor="middle" className="fill-gray-800 dark:fill-white" style={{ fontSize: "22px", fontWeight: "700", fill: color }}>{percent}%</text>
            <text x="70" y="83" textAnchor="middle" style={{ fontSize: "10px", fill: "#6b7280" }}>Affordable</text>
        </svg>
    );
}

// Animated bar
function Bar({ label, value, max, color, prefix = "₹" }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="font-bold" style={{ color }}>{prefix}{value?.toLocaleString("en-IN")}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

function BudgetAnalyzer() {
    const { user } = useContext(AuthContext);
    const [budget, setBudget] = useState("");
    const [city, setCity] = useState("Bangalore");
    const [type, setType] = useState("");
    const [furnished, setFurnished] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const analyze = async () => {
        if (!budget || isNaN(budget) || Number(budget) < 1000) return;
        setLoading(true);

        const b = Number(budget);
        const cityAvg = CITY_AVERAGES[city] || 8000;

        try {
            // Use server-side aggregation — no more pulling all properties to the browser
            const params = new URLSearchParams({ maxBudget: b, city });
            if (type) params.append("propertyType", type);
            if (furnished) params.append("furnished", "true");

            const res = await fetch(`${API_URL}/api/property/stats/budget?${params}`);
            const stats = await res.json();

            const vsCityAvg = b - cityAvg;
            const savings = stats.avgPrice > 0 ? b - stats.avgPrice : 0;
            const maxBracketCount = Math.max(...(stats.brackets || []).map(bk => bk.count), 1);

            // Suggestions based on real server data
            const suggestions = [];
            if (b < cityAvg) suggestions.push({ type: "warning", text: `Your budget (₹${b.toLocaleString("en-IN")}) is ₹${(cityAvg - b).toLocaleString("en-IN")} below ${city}'s average rent of ₹${cityAvg.toLocaleString("en-IN")}/mo. Shared rooms or hostels are your best bet.` });
            if (b >= cityAvg * 1.5) suggestions.push({ type: "success", text: `Strong budget! ₹${(b - cityAvg).toLocaleString("en-IN")} above the ${city} average — you can comfortably afford premium or private rooms.` });
            if (stats.unlockAt2K > 0) suggestions.push({ type: "tip", text: `Increasing by just ₹2,000 unlocks ${stats.unlockAt2K} more listing${stats.unlockAt2K > 1 ? 's' : ''} on Dormify.` });
            if (stats.affordableCount < 3 && stats.totalCount > 0) suggestions.push({ type: "warning", text: `Only ${stats.affordableCount} listing${stats.affordableCount !== 1 ? 's' : ''} match your budget. Try relaxing filters or bumping up by ₹3,000–₹5,000.` });
            if (stats.avgPrice > 0 && savings > 0) suggestions.push({ type: "success", text: `The average affordable listing (₹${stats.avgPrice.toLocaleString("en-IN")}/mo) leaves you ₹${savings.toLocaleString("en-IN")} of breathing room — great for security deposits.` });

            setResults({
                affordPct: stats.affordPct,
                affordableCount: stats.affordableCount,
                avgPrice: stats.avgPrice,
                savings,
                vsCityAvg,
                cityAvg,
                topPicks: stats.topPicks || [],
                suggestions,
                b,
                city,
                brackets: stats.brackets || [],
                maxBracketCount,
                unlockAt2K: stats.unlockAt2K,
                unlockAt5K: stats.unlockAt5K,
            });
            setAnalyzed(true);
        } catch (e) {
            console.error("Budget analysis failed:", e);
        }
        setLoading(false);
    };

    const reset = () => { setAnalyzed(false); setResults(null); setBudget(""); };

    const gaugeColor = results?.affordPct >= 60 ? "#10b981" : results?.affordPct >= 30 ? "#f59e0b" : "#ef4444";

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="pt-24 pb-10 px-4 md:px-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-950">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-gray-900 dark:text-white leading-tight">
                            Smart <span className="gradient-text">Budget Analyzer</span>
                        </h1>
                        <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Know exactly what you can afford before you search. Get a personalized breakdown,
                            market comparison, and smart money-saving tips tailored for students.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 pb-24">
                <AnimatePresence mode="wait">
                    {!analyzed ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* Input Form */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl p-6 md:p-10">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Enter your details</h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Budget */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Housing Budget (₹) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-lg">₹</span>
                                            <input
                                                type="number"
                                                value={budget}
                                                onChange={e => setBudget(e.target.value)}
                                                placeholder="e.g. 12000"
                                                className="w-full pl-10 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        {/* Quick select */}
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {[5000, 8000, 12000, 18000, 25000].map(v => (
                                                <button key={v} onClick={() => setBudget(String(v))}
                                                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${budget === String(v) ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"}`}>
                                                    ₹{v.toLocaleString("en-IN")}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City / Location</label>
                                        <select value={city} onChange={e => setCity(e.target.value)}
                                            className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium">
                                            {Object.keys(CITY_AVERAGES).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Property Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preferred Type</label>
                                        <select value={type} onChange={e => setType(e.target.value)}
                                            className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium">
                                            <option value="">Any Type</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="studio">Studio</option>
                                            <option value="shared-room">Shared Room</option>
                                            <option value="private-room">Private Room</option>
                                            <option value="dorm">Hostel/Dorm</option>
                                            <option value="house">House</option>
                                        </select>
                                    </div>

                                    {/* Furnished Toggle */}
                                    <div className="md:col-span-2 flex items-center gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer" onClick={() => setFurnished(!furnished)}>
                                            <div className={`w-12 h-7 rounded-full px-1 flex items-center transition-colors duration-300 ${furnished ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"}`}>
                                                <motion.div animate={{ x: furnished ? 20 : 0 }} className="w-5 h-5 rounded-full bg-white shadow-md" />
                                            </div>
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Furnished only</span>
                                        </label>
                                        <span className="text-xs text-gray-400">(Furnished places cost 20–30% more but are move-in ready)</span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={analyze}
                                    disabled={loading || !budget}
                                    className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" /></svg>
                                            Analyzing your budget...
                                        </>
                                    ) : (
                                        <>Analyze My Budget</>
                                    )}
                                </motion.button>
                            </div>

                            {/* How it works */}
                            <div className="grid md:grid-cols-3 gap-4 mt-8">
                                {[
                                    { icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, title: "Market Comparison", desc: "See how your budget stacks up against city averages" },
                                    { icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, title: "Affordability Score", desc: "Know what % of listings you can actually afford" },
                                    { icon: <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: "Smart Tips", desc: "Personalized money-saving recommendations just for students" },
                                ].map((f, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}
                                        className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-800">
                                        <div className="text-3xl mb-3">{f.icon}</div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1">{f.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Header result bar */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                                        Budget Analysis for <span className="gradient-text">₹{Number(budget).toLocaleString("en-IN")}/mo</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">in {city} · {type || "All Types"} · {furnished ? "Furnished" : "Any Furnishing"}</p>
                                </div>
                                <button onClick={reset} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                    ← Recalculate
                                </button>
                            </div>

                            {/* Main stats row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                {[
                                    { label: "Affordable Listings", value: results.affordableCount, unit: "properties", color: "#6366f1" },
                                    { label: "Avg. Affordable Price", value: results.avgPrice ? `₹${results.avgPrice.toLocaleString("en-IN")}` : "N/A", unit: "/month", color: "#10b981" },
                                    { label: "vs City Average", value: results.vsCityAvg >= 0 ? `+₹${results.vsCityAvg.toLocaleString("en-IN")}` : `-₹${Math.abs(results.vsCityAvg).toLocaleString("en-IN")}`, unit: "above/below avg", color: results.vsCityAvg >= 0 ? "#10b981" : "#ef4444" },
                                    { label: "Potential Monthly Savings", value: results.savings > 0 ? `₹${results.savings.toLocaleString("en-IN")}` : "₹0", unit: "if you pick avg price", color: "#f59e0b" },
                                ].map((stat, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                                        className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                                        <p className="text-xl md:text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{stat.unit}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Gauge + Price Distribution */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Gauge */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 self-start">Affordability Score</h3>
                                    <Gauge percent={results.affordPct} color={gaugeColor} />
                                    <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {results.affordPct >= 60 ? "Excellent! Most listings are within your budget." :
                                         results.affordPct >= 30 ? "Moderate. Explore shared rooms to unlock more options." :
                                         "Limited. Consider increasing budget or switching to shared rooms."}
                                    </p>
                                    {results.unlockAt2K > 0 && (
                                        <div className="mt-4 w-full px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-center">
                                            <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">+₹2,000 unlocks {results.unlockAt2K} more listing{results.unlockAt2K > 1 ? 's' : ''}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Real Price Distribution from actual listings */}
                                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Price Distribution</h3>
                                        <span className="text-[10px] px-2 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">✦ Real site data</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mb-4">Number of listings in each ₹2,000 price band</p>
                                    <div className="space-y-2">
                                        {results.brackets.map((bk, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className={`text-[10px] w-20 shrink-0 font-semibold ${ bk.isAffordable ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`}>
                                                    ₹{(bk.low/1000).toFixed(0)}K–{(bk.high/1000).toFixed(0)}K
                                                </span>
                                                <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.round((bk.count / results.maxBracketCount) * 100)}%` }}
                                                        transition={{ duration: 0.6, delay: i * 0.05 }}
                                                        className={`h-full rounded-lg ${ bk.isAffordable ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                                                    />
                                                    {/* Budget marker */}
                                                    {bk.high > results.b && bk.low < results.b && (
                                                        <div className="absolute top-0 bottom-0 flex items-center gap-1" style={{ left: `${((results.b - bk.low) / (bk.high - bk.low) * (bk.count / results.maxBracketCount) * 100)}%` }}>
                                                            <div className="w-0.5 h-full bg-amber-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[11px] w-6 text-right font-bold shrink-0 ${ bk.isAffordable ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                                                    {bk.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400">
                                        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-indigo-500 inline-block" /> Within budget</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-gray-300 dark:bg-slate-600 inline-block" /> Above budget</span>
                                    </div>
                                </div>
                            </div>

                            {/* City Market Comparison */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-5">📊 {city} Market Comparison</h3>
                                <div className="space-y-3">
                                    <Bar label="Your Budget" value={results.b} max={Math.max(results.b, results.cityAvg) * 1.2} color="#6366f1" />
                                    <Bar label={`${city} Average`} value={results.cityAvg} max={Math.max(results.b, results.cityAvg) * 1.2} color="#94a3b8" />
                                    {results.avgPrice > 0 && <Bar label="Avg. Affordable Listing" value={results.avgPrice} max={Math.max(results.b, results.cityAvg) * 1.2} color="#10b981" />}
                                </div>
                            </div>

                            {/* Smart Suggestions */}
                            {results.suggestions.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">⚡ Smart Insights</h3>
                                    {results.suggestions.map((s, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                            className={`flex items-start gap-3 p-4 rounded-2xl text-sm ${
                                                s.type === "warning" ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300" :
                                                s.type === "success" ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300" :
                                                "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300"
                                            }`}>
                                        <div className="shrink-0 pt-0.5">
                                            {s.type === "warning" ? (
                                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            ) : s.type === "success" ? (
                                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                        </div>
                                        <p>{s.text}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Top Picks */}
                            {results.topPicks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                                        Top Picks Within Your Budget
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {results.topPicks.map((p, i) => (
                                            <Link key={p._id} to={`/property/${p._id}`}>
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all hover:shadow-lg group">
                                                    <div className="h-32 overflow-hidden">
                                                        <img src={p.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    </div>
                                                    <div className="p-4">
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white line-clamp-1">{p.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.city}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">₹{p.price?.toLocaleString("en-IN")}/mo</span>
                                                            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                                                {p.averageRating || "New"}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                                            Save ₹{(Number(budget) - p.price).toLocaleString("en-IN")}/mo vs budget
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Money Saving Tips */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Student Money-Saving Tips
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {TIPS.map((tip, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                                            className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
                                            <div className="text-2xl mb-2">{tip.icon}</div>
                                            <p className="font-bold text-xs text-gray-800 dark:text-white mb-1">{tip.title}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{tip.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-center shadow-xl shadow-indigo-500/25">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                                    {results.affordableCount > 0 ? `${results.affordableCount} properties waiting for you!` : "Explore all listings"}
                                </h3>
                                <p className="text-indigo-100 text-sm mb-6">Browse verified properties that match your budget and preferences.</p>
                                <Link to={`/listings?${type ? `propertyType=${type}&` : ""}${furnished ? "furnished=true&" : ""}maxPrice=${budget}`}
                                    className="inline-block px-8 py-3.5 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                                    Browse Matching Listings →
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Footer />
        </div>
    );
}

export default BudgetAnalyzer;
