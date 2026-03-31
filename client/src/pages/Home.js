import { useEffect, useState, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";
import NearbyMap from "../components/NearbyMap";
import SpotlightCard from "../components/SpotlightCard";
import LiquidTextInteraction from "../components/LiquidTextInteraction";
import { LanguageContext } from "../context/LanguageContext";
import { AuthContext } from "../context/AuthContext";
import { useScrollReveal, useScrollFadeOut } from "../hooks/useScrollEffects";
import API_URL from "../config/api";

const stats = [
    { numberKey: "students", fallback: "50,000+", labelKey: "happyStudents", icon: "🎓" },
    { numberKey: "properties", fallback: "8,500+", labelKey: "verifiedListings", icon: "🏠" },
    { number: "500+", labelKey: "universities", icon: "🏛️" },
    { number: "4.8★", labelKey: "avgRating", icon: "⭐" },
];

const indianUniversities = [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "IISc Bangalore",
    "JNU Delhi", "Delhi University", "Anna University", "BHU Varanasi",
    "BITS Pilani", "NIT Trichy", "Christ University", "Symbiosis Pune",
    "IIT Hyderabad", "IIIT Hyderabad", "VIT Vellore", "Amity University"
];

function ScrollRevealSection({ children, className = "", delay = 0 }) {
    const [ref, isRevealed] = useScrollReveal({ threshold: 0.1 });
    return (
        <div
            ref={ref}
            className={`scroll-reveal ${isRevealed ? "revealed" : ""} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

function FadeOutSection({ children, className = "" }) {
    const [ref, isFaded] = useScrollFadeOut();
    return (
        <div
            ref={ref}
            className={`scroll-fade-out ${isFaded ? "faded" : ""} ${className}`}
        >
            {children}
        </div>
    );
}

function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liveStats, setLiveStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);
    const [activeStat, setActiveStat] = useState(null);
    const navigate = useNavigate();
    const { t } = useContext(LanguageContext);
    const { user } = useContext(AuthContext);



    useEffect(() => {
        // Fetch featured properties
        fetch(`${API_URL}/api/property/featured`)
            .then((res) => res.json())
            .then((data) => {
                setFeatured(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Fetch live platform stats from a public endpoint
        fetch(`${API_URL}/api/property?limit=1`)
            .then(res => res.json())
            .then(data => {
                // Use paginated total if available
                if (data?.total !== undefined) {
                    setLiveStats(prev => ({ ...prev, properties: data.total }));
                }
            })
            .catch(() => { });

        // Check for newly registered user
        if (sessionStorage.getItem("showWelcomeModal") === "true") {
            setShowWelcome(true);
            sessionStorage.removeItem("showWelcomeModal");
        }
    }, [API_URL]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const howItWorks = [
        {
            step: "01",
            title: t("searchFilter"),
            description: t("searchFilterDesc"),
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
        },
        {
            step: "02",
            title: t("tourCompare"),
            description: t("tourCompareDesc"),
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
        },
        {
            step: "03",
            title: t("bookMoveIn"),
            description: t("bookMoveInDesc"),
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-700">

            {/* ==================== WELCOME ONBOARDING MODAL ==================== */}
            <AnimatePresence>
                {showWelcome && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowWelcome(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-indigo-500/20">
                                🎉
                            </div>
                            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Welcome to Dormify!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Account created successfully. Let's find your perfect place to stay near campus.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">1</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Search by university</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Use the search bar to find listings near your campus.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Compare properties</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Add up to 5 properties to your compare tray to see them side-by-side.</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowWelcome(false)} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/30">
                                Let's go! →
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==================== HERO SECTION SCROLL PARALLAX ==================== */}
            <div className="relative">
                <section className="relative min-h-screen flex items-center overflow-hidden z-0 pt-20">
                    {/* Vercel Geometric Grid Background */}
                    <div className="absolute inset-0 vercel-grid-bg opacity-40 dark:opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-slate-950" />

                    <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Left Content */}
                            <motion.div
                                initial={{ opacity: 0, x: -60 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 mb-6">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {t("trustedBy")}
                                    </span>
                                </div>

                                {/* Flashlight Liquid Text Reveal Component */}
                                <LiquidTextInteraction
                                    text1={t("findYour")}
                                    text2={t("perfectDorm")}
                                    text3={t("nearCampus")}
                                />

                                <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">
                                    {t("heroDescription")}
                                </p>

                                {/* Google Style Search Bar */}
                                <motion.form
                                    onSubmit={handleSearch}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-8 flex gap-3 items-center"
                                >
                                    <div className="flex-1 relative group w-full bg-white dark:bg-[#1f1f1f] rounded-full shadow-[0_1px_5px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-none dark:hover:shadow-[0_2px_15px_rgba(255,255,255,0.05)] transition-all duration-300">
                                        <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 z-20" viewBox="0 0 24 24" fill="none" stroke="url(#google-colors)">
                                            <defs>
                                                <linearGradient id="google-colors" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#4285F4" />
                                                    <stop offset="33%" stopColor="#EA4335" />
                                                    <stop offset="66%" stopColor="#FBBC05" />
                                                    <stop offset="100%" stopColor="#34A853" />
                                                </linearGradient>
                                            </defs>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t("searchPlaceholder")}
                                            className="w-full pl-12 pr-6 py-3.5 rounded-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-0 transition-all font-medium text-base relative z-10"
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{
                                            scale: 1.04,
                                            backgroundColor: "rgba(255, 255, 255, 0.3)",
                                            backdropFilter: "blur(12px)",
                                            boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.15)",
                                            borderColor: "rgba(255, 255, 255, 0.5)"
                                        }}
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ duration: 0.4, ease: "anticipate" }}
                                        type="submit"
                                        className="px-8 py-3.5 rounded-full bg-white text-gray-900 font-bold transition-colors text-base flex items-center justify-center shrink-0 shadow-md border border-gray-200 dark:border-white/20 origin-center relative overflow-hidden group"
                                    >
                                        <span className="relative z-10 drop-shadow-sm">{t("search")}</span>
                                        {/* Liquid Shimmer Light */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 z-0 mix-blend-overlay" />
                                    </motion.button>
                                </motion.form>

                                {/* Quick Links */}
                                <div className="mt-8 flex flex-wrap gap-2 items-center">
                                    <span className="text-sm text-gray-400 mr-2">{t("popular")}:</span>
                                    {["IIT Bombay", "Delhi University", "IISc Bangalore"].map((uni) => (
                                        <Link
                                            key={uni}
                                            to={`/listings?search=${uni}`}
                                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                        >
                                            {uni}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right Side - Ultra-Premium UI Mockup */}
                            <motion.div
                                initial={{ opacity: 0, x: 60 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="hidden lg:block relative"
                            >
                                {/* Main Property Showcase Card */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.25)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
                                    style={{ zIndex: 1 }}
                                >
                                    {/* Use live featured property image or fallback */}
                                    {(() => {
                                        if (loading) return (
                                            <div className="w-full h-80 bg-gray-200 dark:bg-slate-800 animate-pulse flex flex-col justify-end p-5">
                                                <div className="w-32 h-3 bg-gray-300 dark:bg-slate-700 rounded mb-3"></div>
                                                <div className="w-48 h-5 bg-gray-300 dark:bg-slate-700 rounded mb-2"></div>
                                                <div className="w-24 h-4 bg-gray-300 dark:bg-slate-700 rounded mb-4"></div>
                                                <div className="flex gap-2">
                                                    <div className="w-12 h-6 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
                                                    <div className="w-12 h-6 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
                                                </div>
                                            </div>
                                        );

                                        const heroProperty = featured[0];
                                        const heroImg = heroProperty?.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=700";
                                        const heroTitle = heroProperty?.title || "Premium 2BHK Apartment";
                                        const heroCity = heroProperty?.city || "Near IIT Bombay";
                                        const heroPrice = heroProperty ? `₹${heroProperty.price?.toLocaleString('en-IN')}` : "₹22,000";
                                        const heroRating = heroProperty?.avgRating || 4.9;
                                        const heroReviews = heroProperty?.reviewCount || 238;
                                        const heroAmenities = heroProperty?.amenities?.slice(0, 4) || ["WiFi", "AC", "Furnished", "Parking"];
                                        return (
                                            <>
                                                <img
                                                    src={heroImg}
                                                    alt={heroTitle}
                                                    className="w-full h-80 object-cover scale-105 hover:scale-100 transition-transform duration-700"
                                                />
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                                {/* Card Info Bar */}
                                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-widest">{heroCity}</p>
                                                            <h3 className="text-white font-bold text-lg leading-tight">{heroTitle}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex">{[1, 2, 3, 4, 5].map(s => <svg key={s} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>)}</div>
                                                                <span className="text-white/60 text-xs">{heroRating} ({heroReviews} reviews)</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white/60 text-xs">Starting at</p>
                                                            <p className="text-2xl font-bold text-white">{heroPrice}<span className="text-sm font-normal text-white/60">/mo</span></p>
                                                        </div>
                                                    </div>
                                                    {/* Amenity Pills */}
                                                    <div className="flex gap-2 mt-3 flex-wrap">
                                                        {heroAmenities.map(a => (
                                                            <span key={a} className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[10px] font-semibold border border-white/20">{a}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </motion.div>

                                {/* Live Availability Badge */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 }}
                                    className="absolute -top-4 -right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-500/40"
                                >
                                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                    <span>Available Now</span>
                                </motion.div>

                                {/* Booking Confirmed Notification */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    className="absolute -bottom-6 -left-8 z-10 glass-panel rounded-2xl p-4 shadow-2xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">🎉 Booking Confirmed!</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Anika R. • Move-in Apr 1</p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Second floating card */}
                                <motion.div
                                    animate={{ y: [0, 12, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute top-8 -right-10 z-10 glass-panel rounded-2xl p-3 shadow-2xl"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100" className="w-full h-full object-cover" alt="thumbnail" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">Studio near BITS</p>
                                            <p className="text-[10px] text-indigo-500 font-bold">✦ Score 94 — Best Match</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ==================== ANTIGRAVITY SLIDE-OVER WRAPPER ==================== */}
            <div className="relative z-10 bg-white dark:bg-[#000000] w-full pt-10 pb-10 rounded-t-[3rem] shadow-[0_-30px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_-30px_60px_rgba(0,0,0,0.5)]">

                {/* ==================== STATS ==================== */}
                <ScrollRevealSection>
                    <section className="relative py-20 overflow-hidden">
                        {/* Vercel-style Dark Minimalist Background */}
                        <div className="absolute inset-0 bg-black" />
                        <div className="absolute inset-0 vercel-dot-bg opacity-30 mask-image-bottom" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

                        <div className="relative max-w-7xl mx-auto px-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                                {stats.map((stat, i) => {
                                    // For live-fetched stats, compute the display value
                                    let displayNumber = stat.number;
                                    if (stat.numberKey === "properties" && liveStats?.properties) {
                                        displayNumber = liveStats.properties.toLocaleString('en-IN') + "+";
                                    }
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setActiveStat(i)}
                                            className="relative rounded-[1.5rem] overflow-hidden group cursor-pointer transition-transform duration-300 transform hover:scale-[1.02]"
                                        >
                                            {/* Spinning High-Contrast Light Border Layer (Only shown when clicked/active) */}
                                            {activeStat === i && (
                                                <div
                                                    className="absolute top-1/2 left-1/2 w-[250%] h-[250%] -translate-x-1/2 -translate-y-1/2"
                                                    style={{
                                                        background: "conic-gradient(from 0deg, transparent 60%, rgba(99, 102, 241, 1) 80%, rgba(168, 85, 247, 1) 100%)",
                                                        animation: "spin 2.5s linear infinite"
                                                    }}
                                                />
                                            )}

                                            {/* The Card Background (Sits slightly inside to let the spinning border show through the edges) */}
                                            <div className={`absolute inset-[1px] rounded-[calc(1.5rem-1px)] bg-[#0a0a0a] z-0 transition-all duration-300 ${activeStat === i ? 'inset-[3px]' : ''}`} />

                                            <SpotlightCard
                                                spotlightColor="rgba(255, 255, 255, 0.05)"
                                                className="relative z-10 text-center p-6 md:p-8 rounded-[1.5rem] border border-white/5 bg-transparent backdrop-blur-xl group-hover:border-white/10 transition-colors duration-500 h-full w-full"
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                                    viewport={{ once: true, margin: "-20px" }}
                                                    transition={{ type: "spring", stiffness: 70, damping: 15, delay: i * 0.1 }}
                                                    className="h-full w-full flex flex-col items-center justify-center"
                                                >
                                                    {/* Extremely subtle matte shine */}
                                                    <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                                                    <div className="relative z-10 text-3xl mb-3 opacity-90">{stat.icon}</div>
                                                    <h3 className="relative z-10 text-3xl md:text-4xl font-semibold text-white tracking-tight leading-none">{displayNumber || stat.fallback}</h3>
                                                    <p className="relative z-10 mt-2 text-sm font-medium text-gray-500">{t(stat.labelKey)}</p>
                                                </motion.div>
                                            </SpotlightCard>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </ScrollRevealSection>

                {/* ==================== MAP & NEARBY PROPERTIES ==================== */}
                <NearbyMap />

                {/* ==================== FEATURED LISTINGS ==================== */}
                <section className="py-24 px-6 bg-gray-50/50 dark:bg-slate-900/50">
                    <div className="max-w-7xl mx-auto">
                        <ScrollRevealSection>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                                        {t("featuredListings")} <span className="gradient-text">{t("listingsSuffix")}</span>
                                    </h2>
                                    <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-md">
                                        {t("handpicked")}
                                    </p>
                                </div>
                                <Link
                                    to="/listings"
                                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:gap-3 transition-all duration-300"
                                >
                                    {t("viewAll")}
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </ScrollRevealSection>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {loading ? (
                                [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                            ) : (
                                featured.map((property, i) => (
                                    <motion.div
                                        key={property._id}
                                        initial={{ opacity: 0, y: 60, scale: 0.9 }}
                                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                        viewport={{ once: true, amount: 0.15 }}
                                        transition={{
                                            delay: i * 0.12,
                                            duration: 0.7,
                                            ease: [0.16, 1, 0.3, 1]
                                        }}
                                    >
                                        <PropertyCard {...property} />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* ==================== HOW IT WORKS ==================== */}
                <section className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <ScrollRevealSection>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                                    {t("howItWorks")} <span className="gradient-text">Dormify</span> {t("works")}
                                </h2>
                                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    {t("findingHome")}
                                </p>
                            </div>
                        </ScrollRevealSection>

                        <div className="grid md:grid-cols-3 gap-8">
                            {howItWorks.map((item, i) => (
                                <SpotlightCard key={i} className="bento-card group rounded-3xl" spotlightColor="rgba(99, 102, 241, 0.12)">
                                    <motion.div
                                        initial={{ opacity: 0, y: 60, rotateX: 15 }}
                                        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                        whileHover={{ y: -10, transition: { duration: 0.3 } }}
                                        className="p-10 h-full w-full"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/25 group-hover:shadow-xl group-hover:shadow-indigo-500/30 group-hover:scale-110 transition-all duration-300">
                                            {item.icon}
                                        </div>

                                        <span className="absolute top-6 right-8 text-6xl font-bold text-gray-100 dark:text-slate-800 font-display transition-colors">
                                            {item.step}
                                        </span>

                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{item.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                                    </motion.div>
                                </SpotlightCard>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ==================== UNIVERSITIES ==================== */}
                <section className="py-20 px-6">
                    <div className="max-w-7xl mx-auto">
                        <ScrollRevealSection>
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                                    {t("housingNear")} <span className="gradient-text">{t("topUniversities")}</span>
                                </h2>
                                <p className="mt-4 text-gray-600 dark:text-gray-400">
                                    {t("weCover")}
                                </p>
                            </div>
                        </ScrollRevealSection>

                        <div className="flex flex-wrap justify-center gap-3">
                            {indianUniversities.map((uni, i) => (
                                <motion.div
                                    key={uni}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.04, duration: 0.4 }}
                                    whileHover={{ scale: 1.08, y: -3 }}
                                >
                                    <Link
                                        to={`/listings?search=${uni}`}
                                        className="inline-block px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-lg transition-all duration-300"
                                    >
                                        {uni}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ==================== TESTIMONIALS ==================== */}
                <section className="py-20 overflow-hidden">
                    <ScrollRevealSection>
                        <div className="text-center mb-12 px-6">
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                                Loved by <span className="gradient-text">Students Nationwide</span>
                            </h2>
                            <p className="mt-3 text-gray-500 dark:text-gray-400">Hear from 50,000+ students who found their perfect home on Dormify</p>
                        </div>
                    </ScrollRevealSection>

                    {/* Marquee Container */}
                    <div className="relative">
                        {/* Fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                        <motion.div
                            animate={{ x: [0, -2400] }}
                            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            className="flex gap-6 w-max"
                        >
                            {[
                                { name: "Priya Sharma", college: "IIT Bombay", avatar: "PS", rating: 5, color: "bg-pink-500", text: "Found my PG in 10 minutes! The verified badges gave me confidence. Moved in within 3 days of booking. Absolutely love Dormify!" },
                                { name: "Arjun Mehta", college: "Delhi University", avatar: "AM", rating: 5, color: "bg-blue-500", text: "The comparison feature is a game changer. I compared 3 PGs side by side and picked the best one. Saved me so much time!" },
                                { name: "Sneha Patel", college: "IISc Bangalore", avatar: "SP", rating: 5, color: "bg-emerald-500", text: "Real-time nearby properties using my location was incredible. Found a great hostel 500m from campus that I would have never found otherwise." },
                                { name: "Rohan Gupta", college: "BITS Pilani", avatar: "RG", rating: 4, color: "bg-amber-500", text: "The landlord was responsive and the booking process was seamless. Highly recommend for any student looking for accommodation near campus." },
                                { name: "Ananya Krishnan", college: "Anna University", avatar: "AK", rating: 5, color: "bg-purple-500", text: "As a girl student, the verified listings and safety features gave my parents peace of mind. The chat feature to message landlords is brilliant!" },
                                { name: "Vikram Singh", college: "NIT Trichy", avatar: "VS", rating: 5, color: "bg-rose-500", text: "The price filters and Best Match scores helped me find a furnished PG within my budget near campus. Highly recommend to all NIT students!" },
                                // Duplicates for infinite loop
                                { name: "Priya Sharma", college: "IIT Bombay", avatar: "PS", rating: 5, color: "bg-pink-500", text: "Found my PG in 10 minutes! The verified badges gave me confidence. Moved in within 3 days of booking. Absolutely love Dormify!" },
                                { name: "Arjun Mehta", college: "Delhi University", avatar: "AM", rating: 5, color: "bg-blue-500", text: "The comparison feature is a game changer. I compared 3 PGs side by side and picked the best one. Saved me so much time!" },
                                { name: "Sneha Patel", college: "IISc Bangalore", avatar: "SP", rating: 5, color: "bg-emerald-500", text: "Real-time nearby properties using my location was incredible. Found a great hostel 500m from campus that I would have never found otherwise." },
                                { name: "Rohan Gupta", college: "BITS Pilani", avatar: "RG", rating: 4, color: "bg-amber-500", text: "The landlord was responsive and the booking process was seamless. Highly recommend for any student looking for accommodation near campus." },
                            ].map((review, i) => (
                                <div key={i} className="w-80 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-lg">
                                    <div className="flex gap-0.5 mb-4">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <svg key={s} className={`w-4 h-4 ${s <= review.rating ? "text-amber-400 fill-current" : "text-gray-200"}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        ))}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-4 italic">"{review.text}"</p>
                                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                                        <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-bold text-sm`}>{review.avatar}</div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{review.name}</p>
                                            <p className="text-xs text-gray-500">{review.college}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ==================== CTA ==================== */}
                <section className="py-24 px-6">
                    <ScrollRevealSection>
                        <div className="max-w-4xl mx-auto text-center relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-3xl opacity-10" />

                            <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 md:p-16 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                                <h2 className="relative text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                    {t("readyToFind")}
                                </h2>
                                <p className="relative text-indigo-200 max-w-md mx-auto mb-8">
                                    {t("joinThousands")}
                                </p>
                                <div className="relative flex flex-col sm:flex-row justify-center gap-4">
                                    <Link to="/listings">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                                        >
                                            {t("browseListings")}
                                        </motion.button>
                                    </Link>
                                    <Link to="/register">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
                                        >
                                            {t("createAccount")}
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </ScrollRevealSection>
                </section>

            </div> {/* END ANTIGRAVITY SLIDE-OVER WRAPPER */}

            <Footer />
        </div>
    );
}

export default Home;