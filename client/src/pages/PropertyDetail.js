import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import Footer from "../components/Footer";
import { useScrollReveal } from "../hooks/useScrollEffects";
import { VerifiedBadge, ViewCountBadge, SourceBadge, PopularBadge } from "../components/Badges";
import { PropertyDetailSkeleton } from "../components/Skeleton";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";
import API_URL from "../config/api";

function ScrollRevealDiv({ children, className = "", delay = 0 }) {
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

function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, toggleSaveProperty } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [bookingForm, setBookingForm] = useState({ moveInDate: "", moveOutDate: "", message: "" });
    const [bookingStatus, setBookingStatus] = useState("");
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewStatus, setReviewStatus] = useState("");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [inquiryOpen, setInquiryOpen] = useState(false);
    const [inquiryForm, setInquiryForm] = useState({ name: user?.name || "", email: user?.email || "", phone: "", message: "", moveInDate: "" });
    const [inquiryStatus, setInquiryStatus] = useState(""); // "", "loading", "success"

    useEffect(() => {

        axios.get(`${API_URL}/api/property/${id}`)
            .then(res => { setProperty(res.data); setLoading(false); })
            .catch(() => setLoading(false));

        // Intercept Stripe Success Redirect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("success") === "true") {
            const pendingParams = sessionStorage.getItem("stripe_pending_booking");
            if (pendingParams) {
                const bookingData = JSON.parse(pendingParams);
                axios.post(`${API_URL}/api/booking/book`, {
                    ...bookingData,
                    paymentStatus: "completed",
                    paymentId: urlParams.get("session_id"),
                    orderId: urlParams.get("session_id")
                }).then(() => {
                    sessionStorage.removeItem("stripe_pending_booking");
                    setBookingStatus("success");
                    toast.success("🏠 Stripe Payment Verified & Booking Confirmed!");
                    // Clean URL
                    window.history.replaceState(null, "", `/property/${id}`);
                }).catch(() => {
                    toast.error("Failed to verify booking from Stripe.");
                });
            } else {
                toast.success("Payment Received.");
            }
        }
    }, [id]);

    // Show skeleton while loading
    if (loading) return <PropertyDetailSkeleton />;

    const isSaved = user?.savedProperties?.includes(id);

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!user) { navigate("/login"); return; }
        try {
            setBookingStatus("loading");


            // Calculate total amount
            const start = new Date(bookingForm.moveInDate);
            const end = new Date(bookingForm.moveOutDate);
            const months = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));
            const totalAmount = property.price * months;

            // Cache the booking payload in Browser Session so it survives the Stripe Redirect
            sessionStorage.setItem("stripe_pending_booking", JSON.stringify({
                propertyId: id,
                ...bookingForm
            }));

            // 1. Create fully live Stripe Checkout Session
            const stripeRes = await axios.post(`${API_URL}/api/stripe/create-checkout-session`, {
                propertyId: id,
                propertyTitle: property.title,
                totalAmount: totalAmount,
                ...bookingForm
            });

            // 2. Bruteforce Redirect User securely to Stripe Hosted Payment Page!
            window.location.href = stripeRes.data.url;

        } catch (err) {
            setBookingStatus("");
            sessionStorage.removeItem("stripe_pending_booking");
            // If the key is invalid or expired, we tell the user exactly what to do.
            if (err.response?.data?.message?.includes("API Key") || err.response?.data?.message?.includes("Stripe")) {
                toast.error("Stripe keys missing! Add STRIPE_SECRET_KEY to your server/.env file.", { duration: 6000 });
            } else {
                toast.error("Stripe Connection Error. Check your backend logs.");
            }
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        if (!user) { navigate("/login"); return; }
        try {

            const res = await axios.post(`${API_URL}/api/property/${id}/review`, reviewForm);
            setProperty(res.data);
            setReviewForm({ rating: 5, comment: "" });
            setReviewStatus("success");
        } catch (err) {
            setReviewStatus(err.response?.data?.message || "Review failed");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!property) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Property Not Found</h2>
                <button onClick={() => navigate("/listings")} className="btn-primary">{t("browseListings")}</button>
            </div>
        </div>
    );

    const amenityIcons = {
        "WiFi": "📶", "Laundry": "🧺", "AC": "❄️", "Heating": "🔥", "Kitchen": "🍳",
        "Study Desk": "📚", "Parking": "🅿️", "Gym": "💪", "Pool": "🏊", "Balcony": "🌅",
        "Backyard": "🌿", "Pet Friendly": "🐾", "Bike Storage": "🚲", "Security": "🔒",
        "Concierge": "🛎️", "Rooftop": "🏙️", "Co-working Space": "💻", "Hot Tub": "♨️",
        "Fireplace": "🔥", "Patio": "☀️", "Meals Included": "🍽️", "Housekeeping": "🧹",
        "RO Water": "💧", "Shuttle": "🚌"
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-700">
            {/* Dynamic SEO Tags */}
            <Helmet>
                <title>{property?.title || "Property Details"} | Dormify</title>
                <meta name="description" content={property?.description?.substring(0, 160) || "Find the perfect student housing on Dormify."} />
                <meta property="og:title" content={`${property?.title} | Dormify`} />
                <meta property="og:description" content={property?.description?.substring(0, 160)} />
                <meta property="og:image" content={property?.images?.[0] || ""} />
                <meta property="og:type" content="website" />
            </Helmet>

            <div className="max-w-7xl mx-auto px-6 py-12 pt-28">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors">
                        {t("backToListings")}
                    </motion.button>

                    {/* Image Gallery */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                        <div className="rounded-3xl overflow-hidden h-96 md:h-[500px] relative group">
                            <img src={property.images?.[selectedImage] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"} alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            {/* Save */}
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => user ? toggleSaveProperty(id) : navigate("/login")}
                                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow-lg">
                                <svg className={`w-6 h-6 ${isSaved ? "text-red-500 fill-current" : "text-gray-600"}`} fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </motion.button>
                            {/* Lightbox Trigger */}
                            <button onClick={() => { setLightboxIndex(selectedImage); setLightboxOpen(true); }}
                                className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm text-white text-sm font-medium hover:bg-black/80 transition-colors flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                View All {property.images?.length || 1} Photos
                            </button>
                            {/* Dynamic Badges */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {property.isVerified && <VerifiedBadge size="md" />}
                                {property.viewCount > 5 && <ViewCountBadge count={property.viewCount} />}
                                {property.viewCount > 20 && <PopularBadge />}
                                <SourceBadge source={property.source} />
                            </div>
                        </div>
                        {/* Thumbnails */}
                        {property.images?.length > 1 && (
                            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                                {property.images.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImage(i)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-indigo-500 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-10">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-8">
                            <ScrollRevealDiv>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 capitalize mb-3">
                                            {property.propertyType?.replace("-", " ")}
                                        </span>
                                        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">{property.title}</h1>
                                        <div className="flex items-center gap-4 mt-3 text-gray-500 dark:text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                {property.location}
                                            </span>
                                            {property.nearbyUniversity && <span className="text-indigo-600 dark:text-indigo-400 font-medium">📚 {property.nearbyUniversity}</span>}
                                            {property.distanceFromCampus && <span>{property.distanceFromCampus} from campus</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">₹{property.price?.toLocaleString("en-IN")}</p>
                                        <p className="text-sm text-gray-500">{t("perMonth")}</p>
                                    </div>
                                </div>
                            </ScrollRevealDiv>

                            {/* Details Grid */}
                            <ScrollRevealDiv delay={100}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Bedrooms", value: property.bedrooms, icon: "🛏️" },
                                        { label: "Bathrooms", value: property.bathrooms, icon: "🚿" },
                                        { label: "Max Occupants", value: property.maxOccupants, icon: "👥" },
                                        { label: "Lease", value: property.leaseDuration, icon: "📋" },
                                    ].map((d, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                            className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-center hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300"
                                        >
                                            <span className="text-2xl">{d.icon}</span>
                                            <p className="mt-2 text-lg font-bold text-gray-800 dark:text-white">{d.value}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{d.label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </ScrollRevealDiv>

                            {/* Description */}
                            <ScrollRevealDiv delay={200}>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t("aboutProperty")}</h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{property.description}</p>
                            </ScrollRevealDiv>

                            {/* Amenities */}
                            <ScrollRevealDiv delay={300}>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t("amenitiesTitle")}</h2>
                                <div className="flex flex-wrap gap-3">
                                    {property.amenities?.map((a, i) => (
                                        <motion.span
                                            key={i}
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            className="amenity-badge text-sm cursor-default"
                                        >
                                            {amenityIcons[a] || "✨"} {a}
                                        </motion.span>
                                    ))}
                                </div>
                            </ScrollRevealDiv>

                            {/* Reviews */}
                            <ScrollRevealDiv delay={400}>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("reviewsTitle")}</h2>
                                    <div className="flex items-center gap-1">
                                        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <span className="font-bold text-gray-800 dark:text-white">{property.averageRating || t("newRating")}</span>
                                        <span className="text-gray-500">({property.totalReviews || 0})</span>
                                    </div>
                                </div>

                                {property.reviews?.length > 0 ? property.reviews.slice(0, 5).map((r, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">{r.user?.name?.charAt(0) || "?"}</span>
                                            </div>
                                            <span className="font-medium text-gray-800 dark:text-white">{r.user?.name || "Anonymous"}</span>
                                            <div className="flex">{[...Array(5)].map((_, j) => <svg key={j} className={`w-4 h-4 ${j < r.rating ? "text-amber-400" : "text-gray-300 dark:text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">{r.comment}</p>
                                    </motion.div>
                                )) : (property.totalReviews > 0 ? <p className="text-gray-500 dark:text-gray-400">No detailed reviews available yet.</p> : <p className="text-gray-500 dark:text-gray-400">No reviews yet.</p>)}

                                {/* Add Review */}
                                {user && (
                                    <form onSubmit={handleReview} className="mt-6 p-6 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{t("writeReview")}</h3>
                                        <div className="flex gap-2 mb-4">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${n <= reviewForm.rating ? "bg-amber-400 text-white shadow-lg" : "bg-gray-200 dark:bg-slate-700 text-gray-400"}`}>★</button>
                                            ))}
                                        </div>
                                        <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder={t("shareExperience")}
                                            className="input-field mb-4 h-24 resize-none" required />
                                        <button type="submit" className="btn-primary">{t("submitReview")}</button>
                                        {reviewStatus === "success" && <p className="mt-2 text-sm text-emerald-500">{t("reviewSubmitted")}</p>}
                                        {reviewStatus && reviewStatus !== "success" && <p className="mt-2 text-sm text-red-500">{reviewStatus}</p>}
                                    </form>
                                )}
                            </ScrollRevealDiv>
                        </div>

                        {/* Right Sidebar - Booking */}
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-1">
                            <div className="sticky top-28 space-y-6">
                                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t("bookProperty")}</h3>
                                    <form onSubmit={handleBooking} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("moveInDate")}</label>
                                            <input type="date" value={bookingForm.moveInDate} onChange={e => setBookingForm({ ...bookingForm, moveInDate: e.target.value })} className="input-field" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("moveOutDate")}</label>
                                            <input type="date" value={bookingForm.moveOutDate} onChange={e => setBookingForm({ ...bookingForm, moveOutDate: e.target.value })} className="input-field" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("messageOptional")}</label>
                                            <textarea value={bookingForm.message} onChange={e => setBookingForm({ ...bookingForm, message: e.target.value })} placeholder={t("introduceSelf")}
                                                className="input-field h-24 resize-none" />
                                        </div>
                                        <button type="submit" className="btn-primary w-full" disabled={bookingStatus === "loading" || bookingStatus === "Waiting for payment..."}>
                                            {bookingStatus === "loading" ? t("booking") : bookingStatus === "Waiting for payment..." ? "Complete Payment in Popup..." : "💳 Pay & Confirm Booking"}
                                        </button>
                                        {bookingStatus === "success" && <p className="text-sm text-center text-emerald-500 font-medium">{t("bookingSent")}</p>}
                                        {bookingStatus && bookingStatus !== "success" && bookingStatus !== "loading" && <p className="text-sm text-center text-red-500">{bookingStatus}</p>}
                                    </form>
                                </div>

                                {/* Owner Info + Chat */}
                                {property.owner && (
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("listedBy")}</h3>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center cursor-pointer" onClick={() => navigate(`/profile/${property.owner._id}`)}>
                                                <span className="text-white font-bold">{property.owner.name?.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => navigate(`/profile/${property.owner._id}`)}>{property.owner.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{property.owner.email}</p>
                                            </div>
                                        </div>
                                        {/* Chat with Landlord Button */}
                                        <button
                                            onClick={async () => {
                                                if (!user) { navigate("/login"); return; }
                                                try {

                                                    await axios.post(`${API_URL}/api/chat/start`, {
                                                        landlordId: property.owner._id,
                                                        propertyId: id
                                                    });
                                                    navigate("/chat");
                                                } catch (err) {
                                                    console.error("Chat start error", err);
                                                }
                                            }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            💬 Chat with Landlord
                                        </button>
                                        <button
                                            onClick={() => navigate(`/profile/${property.owner._id}`)}
                                            className="w-full mt-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            View Full Profile
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={lightboxIndex}
                slides={(property.images || []).map(src => ({ src }))}
            />

            {/* ─── Quick Inquiry Floating Action Button ─── */}
            {!property?.isLive && (
                <>
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring", stiffness: 300 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setInquiryOpen(true)}
                        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all"
                    >
                        <span className="text-lg">💬</span>
                        <span>Quick Inquiry</span>
                        <span className="flex relative">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-40" />
                            <span className="inline-flex rounded-full h-3 w-3 bg-white opacity-70" />
                        </span>
                    </motion.button>

                    {/* Inquiry Modal */}
                    {inquiryOpen && (
                        <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-4" onClick={() => setInquiryOpen(false)}>
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
                            >
                                <button onClick={() => setInquiryOpen(false)} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>

                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-2xl mb-3">💬</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Inquiry</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">About: <span className="font-medium text-indigo-600 dark:text-indigo-400">{property.title}</span></p>
                                </div>

                                {inquiryStatus === "success" ? (
                                    <div className="text-center py-10">
                                        <div className="text-5xl mb-4">🎉</div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Inquiry Sent!</h3>
                                        <p className="text-gray-500 dark:text-gray-400">The landlord will contact you on <span className="font-medium text-indigo-600">{inquiryForm.email}</span> shortly.</p>
                                        <button onClick={() => { setInquiryOpen(false); setInquiryStatus(""); }} className="mt-6 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500">Done</button>
                                    </div>
                                ) : (
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setInquiryStatus("loading");
                                        try {

                                            await axios.post(`${API_URL}/api/inquiry`, { propertyId: property._id, ...inquiryForm });
                                            setInquiryStatus("success");
                                        } catch (err) {
                                            toast.error("Failed to send inquiry. Please try again.");
                                            setInquiryStatus("");
                                        }
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Name *</label>
                                                <input required value={inquiryForm.name} onChange={(e) => setInquiryForm(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="Your name" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                                                <input value={inquiryForm.phone} onChange={(e) => setInquiryForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="Optional" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email *</label>
                                            <input required type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium" placeholder="your@email.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Preferred Move-in Date</label>
                                            <input type="date" value={inquiryForm.moveInDate} onChange={(e) => setInquiryForm(p => ({ ...p, moveInDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Message *</label>
                                            <textarea required rows={4} value={inquiryForm.message} onChange={(e) => setInquiryForm(p => ({ ...p, message: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium resize-none" placeholder="Hi, I'm interested in this property and would like to know more about..." />
                                        </div>
                                        <button type="submit" disabled={inquiryStatus === "loading"} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70">
                                            {inquiryStatus === "loading" ? "Sending..." : "Send Inquiry →"}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    )}
                </>
            )}

            <Footer />
        </div>
    );
}

export default PropertyDetail;
