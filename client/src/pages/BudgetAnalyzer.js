import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Footer from "../components/Footer";
import API_URL from "../config/api";

const TIPS = [
    { icon: "🍜", title: "Cook at home", desc: "Save ₹3,000–₹5,000/month vs eating out daily." },
    { icon: "🚌", title: "Use public transport", desc: "Living near a bus/metro stop cuts commute cost by 60%." },
    { icon: "🤝", title: "Share with a roommate", desc: "Split rent and utilities to halve your housing cost." },
    { icon: "📶", title: "Negotiate WiFi", desc: "Ask landlord to include WiFi in rent — saves ₹500–₹800/mo." },
    { icon: "💡", title: "Monitor utilities", desc: "Furnished PGs include electricity — prioritize them." },
    { icon: "📦", title: "Move off-peak", desc: "Moving Nov–Jan gets you 15–20% cheaper rents." },
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
    const [allProperties, setAllProperties] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch(`${API_URL}/api/property?limit=100`);
                const data = await res.json();
                const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                setAllProperties(list);
            } catch (e) { console.error(e); }
        };
        fetchAll();
    }, []);

    const analyze = async () => {
        if (!budget || isNaN(budget) || Number(budget) < 1000) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));

        const b = Number(budget);
        const cityAvg = CITY_AVERAGES[city] || 8000;

        // Filter affordable properties from REAL site data only
        let affordable = allProperties.filter(p => p.price <= b);
        if (type) affordable = affordable.filter(p => p.propertyType === type);
        if (furnished) affordable = affordable.filter(p => p.furnished);

        const totalCount = allProperties.length;
        const affordPct = totalCount > 0 ? Math.round((affordable.length / totalCount) * 100) : 0;

        const avgPrice = affordable.length > 0
            ? Math.round(affordable.reduce((s, p) => s + p.price, 0) / affordable.length)
            : 0;

        const savings = avgPrice > 0 ? b - avgPrice : 0;
        const vsCityAvg = b - cityAvg;
        const topPicks = [...affordable].sort((a, b_) => b_.averageRating - a.averageRating).slice(0, 3);

        // Build REAL price distribution from actual listing data (₹2K brackets)
        const BRACKET_SIZE = 2000;
        const allPrices = allProperties.map(p => p.price).filter(Boolean);
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : b * 2;
        const numBrackets = Math.min(10, Math.ceil(maxPrice / BRACKET_SIZE));
        const brackets = [];
        for (let i = 0; i < numBrackets; i++) {
            const low = i * BRACKET_SIZE;
            const high = (i + 1) * BRACKET_SIZE;
            const count = allProperties.filter(p => p.price > low && p.price <= high).filter(p => {
                if (type && p.propertyType !== type) return false;
                if (furnished && !p.furnished) return false;
                return true;
            }).length;
            brackets.push({ low, high, count, isAffordable: high <= b });
        }
        const maxBracketCount = Math.max(...brackets.map(bk => bk.count), 1);

        // Budget unlock: how many more listings at +₹2K and +₹5K
        const unlockAt2K = allProperties.filter(p => p.price > b && p.price <= b + 2000).length;
        const unlockAt5K = allProperties.filter(p => p.price > b && p.price <= b + 5000).length;

        // Suggestions based only on REAL housing data
        const suggestions = [];
        if (b < cityAvg) suggestions.push({ type: "warning", text: `Your budget (₹${b.toLocaleString("en-IN")}) is ₹${(cityAvg - b).toLocaleString("en-IN")} below ${city}'s average rent of ₹${cityAvg.toLocaleString("en-IN")}/mo. Shared rooms or hostels are your best bet.` });
        if (b >= cityAvg * 1.5) suggestions.push({ type: "success", text: `Strong budget! ₹${(b - cityAvg).toLocaleString("en-IN")} above the ${city} average — you can comfortably afford premium or private rooms.` });
        if (unlockAt2K > 0) suggestions.push({ type: "tip", text: `Increasing by just ₹2,000 unlocks ${unlockAt2K} more listing${unlockAt2K > 1 ? 's' : ''} on Dormify.` });
        if (affordable.length < 3 && allProperties.length > 0) suggestions.push({ type: "warning", text: `Only ${affordable.length} listing${affordable.length !== 1 ? 's' : ''} match your budget right now. Try relaxing filters or bumping up by ₹${unlockAt5K > 0 ? '5,000' : '3,000'}.` });
        if (avgPrice > 0 && savings > 0) suggestions.push({ type: "success", text: `The average affordable listing (₹${avgPrice.toLocaleString("en-IN")}/mo) leaves you ₹${savings.toLocaleString("en-IN")} of your budget as breathing room — great for security deposits.` });
        if (furnished) suggestions.push({ type: "tip", text: `Furnished filter active — furnished rooms typically cost 15–25% more. Removing it could unlock ${allProperties.filter(p => p.price <= b && !p.furnished).length} additional listings.` });

        setResults({ affordPct, affordable, avgPrice, savings, vsCityAvg, cityAvg, topPicks, suggestions, b, city, brackets, maxBracketCount, unlockAt2K, unlockAt5K });
        setAnalyzed(true);
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-6">
                            <span className="text-lg">🧮</span>
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Exclusive to Dormify</span>
                        </div>
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
                                        <>🧮 Analyze My Budget</>
                                    )}
                                </motion.button>
                            </div>

                            {/* How it works */}
                            <div className="grid md:grid-cols-3 gap-4 mt-8">
                                {[
                                    { icon: "📊", title: "Market Comparison", desc: "See how your budget stacks up against city averages" },
                                    { icon: "🏠", title: "Affordability Score", desc: "Know what % of listings you can actually afford" },
                                    { icon: "💡", title: "Smart Tips", desc: "Personalized money-saving recommendations just for students" },
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
                                    { label: "Affordable Listings", value: results.affordable.length, unit: "properties", color: "#6366f1" },
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
                                            <span className="text-base">{s.type === "warning" ? "⚠️" : s.type === "success" ? "✅" : "💡"}</span>
                                            <p>{s.text}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Top Picks */}
                            {results.topPicks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">🏆 Top Picks Within Your Budget</h3>
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
                                                            <span className="text-xs text-amber-500">⭐ {p.averageRating || "New"}</span>
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
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">💰 Student Money-Saving Tips</h3>
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
                                    {results.affordable.length > 0 ? `${results.affordable.length} properties waiting for you!` : "Explore all listings"}
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
