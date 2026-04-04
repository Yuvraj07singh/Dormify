import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import ToastProvider from "./components/ToastProvider";
import { CompareProvider, useCompare } from "./context/CompareContext";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonCard from "./components/SkeletonCard";

// Lazy Loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Listings = lazy(() => import("./pages/Listings"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LandlordBookings = lazy(() => import("./pages/LandlordBookings"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ComparePage = lazy(() => import("./pages/Compare"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BudgetAnalyzer = lazy(() => import("./pages/BudgetAnalyzer"));
const RoommateFinder = lazy(() => import("./pages/RoommateFinder"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

function FloatingHomeButton() {
    const location = useLocation();
    if (location.pathname === "/") return null;
    
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
        >
            <Link
                to="/"
                className="fixed bottom-6 left-6 z-[950] w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-gray-200 dark:border-slate-700 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 hover:rotate-3 group"
                title="Go Home"
            >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </Link>
        </motion.div>
    );
}

function CompareFloatingTray() {
    const { compareList, clearCompare } = useCompare();
    if (compareList.length === 0) return null;
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-900/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border border-white/10"
        >
            <div className="flex -space-x-2">
                {compareList.map(p => (
                    <div key={p._id} className="w-9 h-9 rounded-full border-2 border-gray-700 overflow-hidden flex-shrink-0">
                        <img src={p.images?.[0] || ""} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
            <span className="text-white text-sm font-semibold">{compareList.length} selected</span>
            <Link to="/compare" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">Compare</Link>
            <button onClick={clearCompare} className="text-gray-400 hover:text-white text-xs transition-colors">Clear</button>
        </motion.div>
    );
}

// Universal Page Transition Wrapper for buttery-smooth route changes
const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="page-transition-wrapper min-h-screen"
    >
        {children}
    </motion.div>
);

// Fallback loader for Suspense
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);

function App() {
    return (
        <ErrorBoundary>
            <CompareProvider>
                <Router>
                    <ToastProvider />
                    <Navbar />
                    <CompareFloatingTray />
                    <FloatingHomeButton />

                    <Suspense fallback={<PageLoader />}>
                        <AnimatePresence mode="wait">
                            <Routes>
                                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                                <Route path="/listings" element={<PageTransition><Listings /></PageTransition>} />
                                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                                <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                                <Route path="/verify-email/:token" element={<PageTransition><VerifyEmail /></PageTransition>} />
                                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                                <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                                <Route path="/reset-password/:token" element={<PageTransition><ResetPassword /></PageTransition>} />
                                <Route path="/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
                                <Route path="/bookings" element={<PageTransition><Bookings /></PageTransition>} />
                                <Route path="/landlord-bookings" element={<PageTransition><LandlordBookings /></PageTransition>} />
                                <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
                                <Route path="/profile/:id" element={<PageTransition><Profile /></PageTransition>} />
                                <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
                                <Route path="/compare" element={<PageTransition><ComparePage /></PageTransition>} />
                                <Route path="/budget-analyzer" element={<PageTransition><BudgetAnalyzer /></PageTransition>} />
                                <Route path="/roommate-finder" element={<PageTransition><RoommateFinder /></PageTransition>} />
                            </Routes>
                        </AnimatePresence>
                    </Suspense>
                </Router>
            </CompareProvider>
        </ErrorBoundary>
    );
}

export default App;