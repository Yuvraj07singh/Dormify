import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { LocationContext } from "../context/LocationContext";
import toast from "react-hot-toast";

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
    const [navExpanded, setNavExpanded] = useState(true);
    const [winking, setWinking] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
        setLangMenuOpen(false);
        setMoreMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
    };

    // Primary links always visible in navbar
    const primaryLinks = [
        { path: "/", label: t("home") },
        { path: "/listings", label: t("listings") },
        { path: "/budget-analyzer", label: "Budget" },
    ];

    // Secondary links in "More" dropdown
    const secondaryLinks = [
        { path: "/pricing", label: "Pricing" },
        { path: "/compare", label: "Compare" },
        ...(user ? [{ path: "/chat", label: "Messages" }] : []),
        ...(user?.role === "landlord" ? [{ path: "/landlord-bookings", label: "Bookings" }] : []),
        ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin" }] : []),
    ];

    // All links for mobile menu
    const allLinks = [...primaryLinks, ...secondaryLinks];

    const handleLogoClick = () => {
        setNavExpanded((prev) => !prev);
        if (navExpanded) { // If it was eating them
            setTimeout(() => {
                setWinking(true);
                setTimeout(() => setWinking(false), 800);
            }, 600); // Wait for the roll-in animation to complete
        }
    };

    const currentLang = languages.find(l => l.code === language);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 z-[100] transition-all duration-300 pointer-events-none"
        >
            <div className={`pointer-events-auto max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center transition-all duration-500 ${
                scrolled 
                ? "py-3 rounded-[2rem] bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] mt-2 md:mt-4 mx-4 xl:mx-auto" 
                : "py-4 bg-transparent border-transparent mt-0"
            }`}>
                {/* Minimal Vercel-style Logo with Wink Logic */}
                <button onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer border-none bg-transparent select-none z-50">
                    <motion.div
                        className="w-9 h-9 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-lg shadow-sm"
                        animate={winking ? { rotateY: 180, scale: 1.2 } : { rotateY: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                        <span className="font-extrabold text-xl" style={{ transform: winking ? "rotateY(180deg)" : "none" }}>{winking ? "😉" : "D"}</span>
                    </motion.div>
                    <span className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                        Dormify
                    </span>
                </button>

                {/* Desktop Nav with Rolling Eat Animation */}
                <AnimatePresence>
                    {navExpanded && (
                        <motion.div 
                            initial={{ width: 0, opacity: 0, x: -30 }}
                            animate={{ width: "auto", opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -50 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="hidden md:flex items-center gap-1 overflow-hidden whitespace-nowrap"
                        >
                            {primaryLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        location.pathname === link.path
                                            ? "text-gray-900 dark:text-white bg-gray-100/50 dark:bg-white/5"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* More dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setMoreMenuOpen(!moreMenuOpen); setUserMenuOpen(false); setLangMenuOpen(false); }}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        secondaryLinks.some(l => l.path === location.pathname)
                                            ? "text-gray-900 dark:text-white bg-gray-100/50 dark:bg-white/5"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    More
                                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <AnimatePresence>
                                    {moreMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                            transition={{ duration: 0.18 }}
                                            className="absolute left-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 shadow-2xl overflow-hidden z-50"
                                        >
                                            <div className="p-1.5">
                                                {secondaryLinks.map((link) => (
                                                    <Link
                                                        key={link.path}
                                                        to={link.path}
                                                        className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                            location.pathname === link.path
                                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                        }`}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    {/* Location Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchLocation}
                        disabled={isLocating}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLocating ? (
                            <svg className="w-4 h-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" /></svg>
                        ) : (
                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                        <span className="max-w-[120px] truncate">{address}</span>
                    </motion.button>

                    {/* Language Selector */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setLangMenuOpen(!langMenuOpen); setUserMenuOpen(false); }}
                            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300 text-lg"
                            title="Change Language"
                        >
                            {currentLang?.flag || "🌐"}
                        </motion.button>

                        <AnimatePresence>
                            {langMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="language-dropdown"
                                >
                                    <div className="p-2">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    changeLanguage(lang.code);
                                                    setLangMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
                                                    language === lang.code
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <span className="text-lg">{lang.flag}</span>
                                                <span>{lang.label}</span>
                                                {language === lang.code && (
                                                    <svg className="w-4 h-4 ml-auto text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
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

                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300"
                    >
                        {dark ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </motion.button>

                    {/* Auth */}
                    {user ? (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setUserMenuOpen(!userMenuOpen); setLangMenuOpen(false); }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {user.name?.split(" ")[0]}
                                </span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </motion.button>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="p-2">
                                            <Link to="/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {t("myBookings")}
                                            </Link>
                                            <Link to="/chat" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                Messages
                                            </Link>
                                            <Link to={`/profile/${user?._id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                {t("signOut")}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="hidden md:block px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300"
                            >
                                {t("signIn")}
                            </Link>
                            <Link to="/register">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
                                >
                                    {t("getStarted")}
                                </motion.button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute top-full left-0 right-0 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-slate-700/50 shadow-2xl pointer-events-auto mt-2 mx-4 rounded-3xl overflow-hidden"
                    >
                        <div className="p-4 space-y-1">
                            {allLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        location.pathname === link.path
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                            : "text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {!user && (
                                <Link
                                    to="/login"
                                    className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {t("signIn")}
                                </Link>
                            )}
                            {/* Mobile Location Button */}
                            <button
                                onClick={() => { fetchLocation(); setMobileOpen(false); }}
                                disabled={isLocating}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 w-full text-left"
                            >
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {isLocating ? "Locating..." : address || "Set Location"}
                            </button>
                            {/* Mobile Language Options */}
                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                                <p className="px-4 py-1 text-xs text-gray-400 uppercase">Language</p>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { changeLanguage(lang.code); setMobileOpen(false); }}
                                        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                                            language === lang.code
                                                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                                                : "text-gray-600 dark:text-gray-300"
                                        }`}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

export default Navbar;