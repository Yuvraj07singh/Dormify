import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useContext, useRef, useCallback, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { useCompare } from "../context/CompareContext";

function PropertyCard({ _id, title, location, city, price, priceType, images, amenities, bedrooms, bathrooms, averageRating, totalReviews, propertyType, nearbyUniversity, furnished, distanceFromCampus, isLive, source, onLiveClick }) {
    const navigate = useNavigate();
    const { user, toggleSaveProperty } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const { addToCompare, removeFromCompare, isInCompare } = useCompare();
    const isSaved = user?.savedProperties?.includes(_id);
    const inCompare = isInCompare(_id);
    const cardRef = useRef(null);
    const shineRef = useRef(null);
    const [currentImage, setCurrentImage] = useState(0);

    // ─── Best Match Score (0–100, purely frontend) ────────────────────────
    const bestMatchScore = (() => {
        let score = 50;
        if (price && price <= 10000) score += 20;
        else if (price && price <= 20000) score += 10;
        else if (price && price >= 30000) score -= 10;
        if (furnished) score += 10;
        if (averageRating >= 4.5) score += 15;
        else if (averageRating >= 4.0) score += 8;
        if (nearbyUniversity) score += 5;
        return Math.min(100, Math.max(0, score));
    })();
    const isBestMatch = bestMatchScore >= 85;

    const nextImage = (e) => {
        e.stopPropagation();
        if (images?.length > 1) setCurrentImage((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        if (images?.length > 1) setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleSave = async (e) => {
        e.stopPropagation();
        if (!user) {
            navigate("/login");
            return;
        }
        try {
            await toggleSaveProperty(_id);
        } catch (err) {
            console.error(err);
        }
    };

    // 3D Tilt Effect
    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        const shine = shineRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;

        // Move holographic shine
        if (shine) {
            const shineX = (x / rect.width) * 100;
            const shineY = (y / rect.height) * 100;
            shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        const shine = shineRef.current;
        if (card) {
            card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)";
        }
        if (shine) {
            shine.style.background = "transparent";
        }
    }, []);

    const typeLabels = {
        apartment: "Apartment",
        studio: "Studio",
        "shared-room": "Shared Room",
        "private-room": "Private Room",
        dorm: "Hostel",
        house: "House"
    };

    const typeColors = {
        apartment: "bg-blue-500",
        studio: "bg-purple-500",
        "shared-room": "bg-emerald-500",
        "private-room": "bg-amber-500",
        dorm: "bg-rose-500",
        house: "bg-cyan-500"
    };

    return (
        <motion.div
            layout
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`property-card spotlight-wrapper glass-panel interactive-card card-shine group ${isLive ? 'cursor-pointer ring-2 ring-emerald-500' : 'cursor-pointer'} ${inCompare ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => isLive ? (onLiveClick && onLiveClick()) : navigate(`/property/${_id}`)}
            style={{ transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease" }}
        >
            {/* Holographic Shine Overlay */}
            <div
                ref={shineRef}
                className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
                style={{ transition: "background 0.3s ease" }}
            />

            {/* Dormify Score Badge */}
            {!isLive && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1 ${
                        isBestMatch
                            ? "bg-amber-400 text-amber-900 shadow-amber-400/40"
                            : bestMatchScore >= 70
                            ? "bg-emerald-500/90 text-white shadow-emerald-500/30"
                            : "bg-black/40 text-white"
                    }`}
                >
                    {isBestMatch ? "🏆 Best" : `✦ ${bestMatchScore}`}
                </motion.div>
            )}

            {/* Image Carousel */}
            <div className="relative h-40 md:h-64 overflow-hidden group/carousel">
                <AnimatePresence initial={false} mode="wait">
                    <motion.img
                        key={currentImage}
                        src={images?.[currentImage] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                        alt={title}
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-cover parallax-image"
                        loading="lazy"
                    />
                </AnimatePresence>

                {/* Carousel Navigation */}
                {images?.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/60 dark:hover:bg-black/60 shadow-lg z-20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/60 dark:hover:bg-black/60 shadow-lg z-20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                        {/* Carousel Dots */}
                        <div className="absolute bottom-11 left-0 right-0 flex justify-center gap-1.5 z-20">
                            {images.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImage ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "w-1.5 bg-white/50"}`} />
                            ))}
                        </div>
                    </>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Animated border on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/30 rounded-t-2xl transition-all duration-500" />

                {/* Type Badge */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${typeColors[propertyType] || "bg-indigo-500"} backdrop-blur-sm shadow-lg`}
                >
                    {typeLabels[propertyType] || propertyType}
                </motion.div>

                {/* Badges/Save Button */}
                {isLive ? (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg z-20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE OSM
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={handleSave}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all z-20"
                    >
                        <svg
                        className={`w-5 h-5 transition-all duration-300 ${isSaved ? "text-red-500 fill-current scale-110" : "text-gray-600 dark:text-gray-300"}`}
                        fill={isSaved ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </motion.button>
                )}

                {/* Price Tag with slide-in */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg"
                >
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{price?.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/{priceType || "month"}</span>
                </motion.div>

                {/* Source Badge */}
                <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg backdrop-blur-sm text-[10px] font-bold text-white shadow-sm ${
                    isLive ? 'bg-emerald-500/90' : 
                    source === '99acres' ? 'bg-blue-500/90' : 
                    source === 'JustDial' ? 'bg-yellow-500/90' : 
                    source === 'MagicBricks' ? 'bg-red-500/90' : 
                    'bg-indigo-500/90'
                }`}>
                    {isLive ? 'LIVE DATA' : source ? `✓ ${source}` : '✓ Verified'}
                </div>
            </div>

            {/* Content */}
            <div className="p-3 md:p-5 relative">
                {/* Hover glow line */}
                <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm md:text-lg font-semibold text-gray-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                        {title}
                    </h3>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-white ml-1">{averageRating || t("newRating")}</span>
                    </div>
                    {totalReviews > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">({totalReviews} {t("reviews")})</span>
                    )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{city || location}</span>
                    {distanceFromCampus && (
                        <span className="text-indigo-500 dark:text-indigo-400 font-medium">· {distanceFromCampus}</span>
                    )}
                </div>

                {/* University */}
                {nearbyUniversity && (
                    <div className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 mb-3">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        <span className="line-clamp-1 font-medium">{nearbyUniversity}</span>
                    </div>
                )}

                {/* Details */}
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {bedrooms} {bedrooms === 1 ? t("bed") : t("beds")}
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        {bathrooms} {bathrooms === 1 ? t("bath") : t("baths")}
                    </span>
                    {furnished && (
                        <span className="flex items-center gap-1 text-emerald-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t("furnished")}
                        </span>
                    )}
                </div>

                {/* Compare Button */}
                {!isLive && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            inCompare
                                ? removeFromCompare(_id)
                                : addToCompare({ _id, title, price, priceType, images, amenities, bedrooms, bathrooms, averageRating, totalReviews, propertyType, nearbyUniversity, furnished, city, location });
                        }}
                        className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                            inCompare
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700"
                                : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-slate-700"
                        }`}
                    >
                        {inCompare ? (
                            <><span>✓ In Comparison</span><span className="text-indigo-200 text-xs">Click to remove</span></>
                        ) : (
                            <><span>+</span><span>Add to Compare</span></>
                        )}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}

export default PropertyCard;