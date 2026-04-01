import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { LocationContext } from "../context/LocationContext";
import toast from "react-hot-toast";

// Icon components (inline SVG helpers)
const Icon = ({ d, className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const ICONS = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    listings: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    budget: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    pricing: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    compare: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    chat: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    admin: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    chevron: "M19 9l-7 7-7-7",
    location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
    sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
};

function Navbar() {
    const { dark, toggleTheme } = useContext(ThemeContext);
    const { user, logout } = useContext(AuthContext);
    const { t, language, changeLanguage, languages } = useContext(LanguageContext);
    const { address, isLocating, fetchLocation } = useContext(LocationContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [winking, setWinking] = useState(false);
    const moreRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close all menus on route change
    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
        setLangMenuOpen(false);
        setMoreMenuOpen(false);
    }, [location]);

    // Close More dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (moreRef.current && !moreRef.current.contains(e.target)) {
                setMoreMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
    };

    const handleLogoClick = () => {
        setWinking(true);
        setTimeout(() => setWinking(false), 900);
    };

    const isActive = (path) => location.pathname === path;

    const primaryLinks = [
        { path: "/", label: t("home"), icon: ICONS.home },
        { path: "/listings", label: t("listings"), icon: ICONS.listings },
        { path: "/budget-analyzer", label: "Budget", icon: ICONS.budget },
    ];

    const moreLinks = [
        { path: "/roommate-finder", label: "Roommates", icon: ICONS.profile, desc: "Find your perfect match" },
        { path: "/pricing", label: "Pricing", icon: ICONS.pricing, desc: "Compare our plans" },
        { path: "/compare", label: "Compare", icon: ICONS.compare, desc: "Side-by-side properties" },
        ...(user ? [{ path: "/chat", label: "Messages", icon: ICONS.chat, desc: "Chat with landlords" }] : []),
        ...(user?.role === "landlord" ? [{ path: "/landlord-bookings", label: "Dashboard", icon: ICONS.bookings, desc: "Manage your listings" }] : []),
        ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: ICONS.admin, desc: "Platform management" }] : []),
    ];

    const allLinks = [...primaryLinks, ...moreLinks];
    const currentLang = languages.find(l => l.code === language);
    const anyMoreActive = moreLinks.some(l => l.path === location.pathname);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
        >
            <div className={`pointer-events-auto mx-4 xl:mx-auto max-w-7xl flex items-center justify-between transition-all duration-500 ${
                scrolled
                    ? "mt-3 px-4 py-2.5 rounded-[1.75rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-gray-200/60 dark:border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                    : "mt-0 px-6 py-4 rounded-none bg-transparent border-transparent"
            }`}>

                {/* ─── Logo ─── */}
                <button
                    onClick={handleLogoClick}
                    className="flex items-center gap-2.5 select-none border-none bg-transparent group"
                >
                    <motion.div
                        animate={winking ? { rotate: [0, -15, 15, 0], scale: [1, 1.2, 1.2, 1] } : {}}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 font-extrabold text-lg"
                    >
                        {winking ? "😉" : "D"}
                    </motion.div>
                    <span className="text-lg md:text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                        Dormify
                    </span>
                </button>

                {/* ─── Desktop Nav Center ─── */}
                <div className="hidden md:flex items-center">
                    {/* Nav pill container */}
                    <div className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl ${scrolled ? "bg-gray-100/70 dark:bg-slate-800/70" : "bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10"}`}>
                        {primaryLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                                    isActive(link.path)
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon d={link.icon} className={`w-3.5 h-3.5 relative z-10 transition-transform duration-200 ${isActive(link.path) ? "" : "group-hover:scale-110"}`} />
                                <span className="relative z-10">{link.label}</span>
                            </Link>
                        ))}

                        {/* More dropdown */}
                        <div className="relative" ref={moreRef}>
                            <button
                                onClick={() => { setMoreMenuOpen(!moreMenuOpen); setUserMenuOpen(false); setLangMenuOpen(false); }}
                                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    anyMoreActive
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                {anyMoreActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">More</span>
                                <motion.svg
                                    animate={{ rotate: moreMenuOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-3.5 h-3.5 relative z-10"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                            </button>

                            <AnimatePresence>
                                {moreMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="absolute left-0 top-[calc(100%+10px)] w-56 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 shadow-2xl shadow-black/10 overflow-hidden z-50"
                                    >
                                        <div className="p-2">
                                            {moreLinks.map((link) => (
                                                <Link
                                                    key={link.path}
                                                    to={link.path}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                                                        isActive(link.path)
                                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                        isActive(link.path)
                                                            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-gray-100 dark:bg-slate-800 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-500 dark:group-hover:bg-indigo-500/10 dark:group-hover:text-indigo-400"
                                                    }`}>
                                                        <Icon d={link.icon} className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold leading-none mb-0.5">{link.label}</p>
                                                        {link.desc && <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-none">{link.desc}</p>}
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        {/* Footer divider */}
                                        <div className="px-3 py-2.5 border-t border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                                            <p className="text-[10px] text-gray-400 font-medium text-center">Dormify — Student Housing Platform</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ─── Right Side Actions ─── */}
                <div className="flex items-center gap-2">

                    {/* Location Pill */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={fetchLocation}
                        disabled={isLocating}
                        className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm backdrop-blur-sm disabled:opacity-60"
                        title="Click to detect location"
                    >
                        {isLocating ? (
                            <svg className="w-3.5 h-3.5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                            </svg>
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow shadow-indigo-500/60 animate-pulse shrink-0" />
                        )}
                        <span className="max-w-[100px] truncate">{address || "Set Location"}</span>
                    </motion.button>

                    {/* Language */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => { setLangMenuOpen(!langMenuOpen); setUserMenuOpen(false); setMoreMenuOpen(false); }}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700 flex items-center justify-center text-base shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                            title="Language"
                        >
                            {currentLang?.flag || "🌐"}
                        </motion.button>
                        <AnimatePresence>
                            {langMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden z-50"
                                >
                                    <div className="p-1.5">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => { changeLanguage(lang.code); setLangMenuOpen(false); }}
                                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
                                                    language === lang.code
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <span className="text-lg">{lang.flag}</span>
                                                <span className="flex-1 text-left">{lang.label}</span>
                                                {language === lang.code && (
                                                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Theme */}
                    <motion.button
                        whileHover={{ scale: 1.08, rotate: dark ? -15 : 15 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={toggleTheme}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                        title="Toggle theme"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={dark ? "sun" : "moon"}
                                initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Icon d={dark ? ICONS.sun : ICONS.moon} className="w-4 h-4 md:w-4.5 md:h-4.5" />
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

                    {/* Auth */}
                    {user ? (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => { setUserMenuOpen(!userMenuOpen); setLangMenuOpen(false); setMoreMenuOpen(false); }}
                                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all"
                            >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                                    <span className="text-white text-sm font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="hidden md:block text-sm font-semibold text-gray-800 dark:text-white max-w-[80px] truncate">
                                    {user.name?.split(" ")[0]}
                                </span>
                                <motion.svg
                                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-3.5 h-3.5 text-gray-400"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                            </motion.button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden z-50"
                                    >
                                        {/* User Header */}
                                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border-b border-gray-100 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                                    <span className="text-white font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            {[
                                                { to: "/bookings", icon: ICONS.bookings, label: t("myBookings") },
                                                { to: "/chat", icon: ICONS.chat, label: "Messages" },
                                                { to: `/profile/${user?._id}`, icon: ICONS.profile, label: "My Profile" },
                                            ].map((item) => (
                                                <Link key={item.to} to={item.to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group">
                                                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                                        <Icon d={item.icon} className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-500 transition-colors" />
                                                    </div>
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <div className="my-1.5 border-t border-gray-100 dark:border-slate-800" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full group"
                                            >
                                                <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                                                    <Icon d={ICONS.logout} className="w-3.5 h-3.5" />
                                                </div>
                                                {t("signOut")}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-800/80 transition-all duration-200"
                            >
                                {t("signIn")}
                            </Link>
                            <Link to="/register">
                                <motion.button
                                    whileHover={{ scale: 1.04, boxShadow: "0 8px 25px rgba(99,102,241,0.4)" }}
                                    whileTap={{ scale: 0.96 }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 transition-all duration-200"
                                >
                                    {t("getStarted")} →
                                </motion.button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700 flex items-center justify-center shadow-sm"
                    >
                        <AnimatePresence mode="wait">
                            <motion.svg
                                key={mobileOpen ? "close" : "open"}
                                initial={{ rotate: -30, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 30, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="w-5 h-5 text-gray-700 dark:text-gray-200"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </motion.svg>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* ─── Mobile Menu ─── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="md:hidden pointer-events-auto mx-4 mt-2 rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-gray-100 dark:border-slate-700 shadow-2xl"
                    >
                        <div className="p-3">
                            {/* Nav Links */}
                            <div className="mb-2">
                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigate</p>
                                {allLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                                            isActive(link.path)
                                                ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-400"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            isActive(link.path)
                                                ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                                : "bg-gray-100 dark:bg-slate-800 text-gray-500"
                                        }`}>
                                            <Icon d={link.icon} className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold">{link.label}</span>
                                        {isActive(link.path) && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {/* Location & Theme row */}
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => { fetchLocation(); setMobileOpen(false); }}
                                    disabled={isLocating}
                                    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-gray-300 transition-all"
                                >
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                                    <span className="truncate">{address || "Set Location"}</span>
                                </button>
                                <button
                                    onClick={toggleTheme}
                                    className="w-12 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all"
                                >
                                    <Icon d={dark ? ICONS.sun : ICONS.moon} className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Auth section */}
                            {!user ? (
                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <Link to="/login" className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition-all">
                                        {t("signIn")}
                                    </Link>
                                    <Link to="/register" className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 transition-all">
                                        {t("getStarted")}
                                    </Link>
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold capitalize">{user.role}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                    >
                                        <Icon d={ICONS.logout} className="w-4 h-4" />
                                        {t("signOut")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

export default Navbar;