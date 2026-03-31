import { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import PropertyCard from "../components/PropertyCard";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";
import { LanguageContext } from "../context/LanguageContext";
import { LocationContext } from "../context/LocationContext";
import API_URL from "../config/api";

// Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function Listings() {
    const { t } = useContext(LanguageContext);
    const { location, setManualLocation } = useContext(LocationContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [propertyType, setPropertyType] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [furnished, setFurnished] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState("grid"); // grid | list
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // Advanced filters
    const [minBeds, setMinBeds] = useState(0);
    const [minRating, setMinRating] = useState(0);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [proximityKm, setProximityKm] = useState(0); // 0 = any

    const AMENITIES = [
        { key: "WiFi", icon: "📶" },
        { key: "AC", icon: "❄️" },
        { key: "Parking", icon: "🚗" },
        { key: "Gym", icon: "💪" },
        { key: "Laundry", icon: "👕" },
        { key: "CCTV", icon: "📹" },
        { key: "Dining", icon: "🍽️" },
        { key: "Study Room", icon: "📚" },
    ];

    const toggleAmenity = (key) => {
        setSelectedAmenities(prev =>
            prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
        );
    };

    // Autocomplete state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(debounceRef.current);
        if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                setSuggestions(data.map(r => ({
                    shortName: r.address?.city || r.address?.town || r.address?.village || r.address?.county || r.display_name.split(",")[0],
                    region: [r.address?.state, r.address?.country].filter(Boolean).join(", "),
                    lat: parseFloat(r.lat),
                    lng: parseFloat(r.lon),
                })));
                setShowSuggestions(true);
            } catch (err) { console.error("Autocomplete error", err); }
            finally { setIsSearching(false); }
        }, 300);
    };

    const handleSuggestionClick = (s) => {
        setSearch(s.shortName);
        setShowSuggestions(false);
        setManualLocation(s.lat, s.lng, s.shortName);
        setSearchParams({ search: s.shortName });
    };

    const propertyTypes = [
        { value: "", label: t("allTypes") },
        { value: "apartment", label: t("apartment") },
        { value: "studio", label: t("studio") },
        { value: "shared-room", label: t("sharedRoom") },
        { value: "private-room", label: t("privateRoom") },
        { value: "dorm", label: t("dorm") },
        { value: "house", label: t("house") },
    ];

    const fetchProperties = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/property?`;
            if (search) url += `search=${encodeURIComponent(search)}&`;
            if (propertyType) url += `propertyType=${propertyType}&`;
            if (furnished) url += `furnished=true&`;
            if (priceRange) {
                const [min, max] = priceRange.split("-");
                url += `minPrice=${min}&maxPrice=${max}&`;
            }

            let allData = [];

            // 1. Fetch DB Properties
            const res = await fetch(url);
            let data = await res.json();
            const dbList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            allData = [...dbList];

            // 2. Fetch Live OSM Properties if Location is set
            if (location) {
                const query = `[out:json];(node["tourism"="hotel"](around:5000,${location.lat},${location.lng});node["tourism"="hostel"](around:5000,${location.lat},${location.lng});node["building"="dormitory"](around:5000,${location.lat},${location.lng});node["building"="apartments"](around:5000,${location.lat},${location.lng}););out 30;`;
                const osmRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

                if (osmRes.data && osmRes.data.elements) {
                    const liveData = osmRes.data.elements.map(el => ({
                        _id: `osm-${el.id}`,
                        title: el.tags?.name || (el.tags?.tourism === "hotel" ? "Local Hotel" : "Nearby Accommodation"),
                        propertyType: el.tags?.tourism === "hotel" ? "private-room" : "apartment",
                        price: Math.floor(Math.random() * 15000) + 5000,
                        location: "Nearby (Live Data)",
                        city: "Sensor Area",
                        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],
                        bedrooms: 1,
                        bathrooms: 1,
                        isLive: true,
                        averageRating: Number((Math.random() * 2 + 3).toFixed(1)),
                        totalReviews: Math.floor(Math.random() * 100) + 1,
                        latitude: el.lat,
                        longitude: el.lon,
                        distance: getDistance(location.lat, location.lng, el.lat, el.lon)
                    }));

                    let filteredLive = liveData;
                    if (propertyType) filteredLive = filteredLive.filter(p => p.propertyType === propertyType);
                    if (priceRange) {
                        const [min, max] = priceRange.split("-");
                        filteredLive = filteredLive.filter(p => p.price >= Number(min) && p.price <= (max === '999999' ? Infinity : Number(max)));
                    }
                    allData = [...allData, ...filteredLive];
                }
            }

            // 3. Advanced Frontend Filters
            if (minBeds > 0) allData = allData.filter(p => (p.bedrooms || 0) >= minBeds);
            if (minRating > 0) allData = allData.filter(p => (p.averageRating || 0) >= minRating);
            if (selectedAmenities.length > 0) {
                allData = allData.filter(p => {
                    const pAmenities = p.amenities || [];
                    return selectedAmenities.every(a =>
                        pAmenities.some(pa => pa.toLowerCase().includes(a.toLowerCase()))
                    );
                });
            }
            if (proximityKm > 0 && location) {
                allData = allData.filter(p => {
                    const d = getDistance(location.lat, location.lng, p.latitude, p.longitude);
                    return d === null || d <= proximityKm;
                });
            }

            // 4. Sort
            if (sortBy === "price-low") allData.sort((a, b) => a.price - b.price);
            else if (sortBy === "price-high") allData.sort((a, b) => b.price - a.price);
            else if (sortBy === "rating") allData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            else if (location && sortBy === "nearest") {
                allData.forEach(p => { if (p.distance === undefined) p.distance = getDistance(location.lat, location.lng, p.latitude, p.longitude) || 9999; });
                allData.sort((a, b) => a.distance - b.distance);
            }

            setProperties(allData);
        } catch (err) {
            console.error(err);
            setProperties([]);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProperties(); }, [search, propertyType, priceRange, furnished, sortBy, location, minBeds, minRating, selectedAmenities, proximityKm]);
    useEffect(() => { const q = searchParams.get("search"); if (q) setSearch(q); }, [searchParams]);

    const clearFilters = () => {
        setSearch(""); setPropertyType(""); setPriceRange("");
        setFurnished(false); setSortBy("newest"); setSearchParams({});
        setMinBeds(0); setMinRating(0); setSelectedAmenities([]); setProximityKm(0);
    };

    const activeFilterCount = [search, propertyType, priceRange, furnished, minBeds > 0, minRating > 0, selectedAmenities.length > 0, proximityKm > 0].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Header */}
            <div className="pt-24 pb-4 px-4 md:px-6 bg-gradient-to-b from-indigo-50 dark:from-slate-900 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
                            {search ? <>{t("resultsFor")} "<span className="gradient-text">{search}</span>"</> : <>{t("allListings")} <span className="gradient-text">{t("listingsSuffix")}</span></>}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{loading ? t("searching") : `${properties.length} ${t("propertiesFound")}`}</p>
                    </motion.div>

                    {/* Filter Bar */}
                    <div className="mt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-3 md:p-5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg">
                        {/* Search + Mobile Filter Toggle */}
                        <div className="flex gap-2">
                            <div ref={searchRef} className="flex-1 relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                {isSearching && <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-400 z-10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" /></svg>}
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearchInput}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder={t("searchCity")}
                                    className="w-full pl-9 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium"
                                />
                                {/* Autocomplete */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50"
                                        >
                                            {suggestions.map((s, i) => (
                                                <button key={i} type="button" onClick={() => handleSuggestionClick(s)}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors text-left">
                                                    <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{s.shortName}</p>
                                                        <p className="text-xs text-gray-400 truncate">{s.region}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Mobile: Filter toggle button */}
                            <button
                                onClick={() => setFiltersOpen(!filtersOpen)}
                                className="md:hidden relative flex items-center gap-1.5 px-3 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                            </button>

                            {/* View mode toggle - desktop only */}
                            <div className="hidden md:flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <button onClick={() => setViewMode("grid")} className={`p-3 ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500"}`}>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button onClick={() => setViewMode("list")} className={`p-3 ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-gray-50 dark:bg-slate-800 text-gray-500"}`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Desktop filters - always visible, Mobile - collapsible */}
                        <AnimatePresence>
                            {(filtersOpen || true) && (
                                <motion.div
                                    initial={false}
                                    className={`${filtersOpen ? "block" : "hidden md:flex"} mt-3 flex-col md:flex-row gap-2 md:gap-3`}
                                >
                                    <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-2 md:mt-0">
                                        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium">
                                            {propertyTypes.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                                        </select>
                                        <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium">
                                            <option value="">{t("anyPrice")}</option>
                                            <option value="0-8000">Under ₹8,000</option>
                                            <option value="8000-15000">₹8,000 – ₹15,000</option>
                                            <option value="15000-25000">₹15,000 – ₹25,000</option>
                                            <option value="25000-999999">₹25,000+</option>
                                        </select>
                                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium">
                                            <option value="newest">{t("newest")}</option>
                                            <option value="price-low">{t("priceLow")}</option>
                                            <option value="price-high">{t("priceHigh")}</option>
                                            <option value="rating">{t("topRated")}</option>
                                            {location && <option value="nearest">Nearest First</option>}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 md:mt-0">
                                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setFurnished(!furnished)}>
                                            <div className={`w-10 h-6 rounded-full px-1 flex items-center transition-colors duration-300 ${furnished ? "bg-indigo-600" : "bg-gray-300 dark:bg-slate-600"}`}>
                                                <motion.div animate={{ x: furnished ? 16 : 0 }} className="w-4 h-4 rounded-full bg-white shadow-md" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("furnished")}</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {/* Advanced toggle */}
                                            <button
                                                onClick={() => setAdvancedOpen(!advancedOpen)}
                                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                                                    advancedOpen
                                                        ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                                        : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                                Advanced {advancedOpen ? "▲" : "▼"}
                                            </button>
                                            {activeFilterCount > 0 && (
                                                <button onClick={clearFilters} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 font-bold transition-colors">{t("clearAll")}</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Advanced Filters Panel */}
                                    <AnimatePresence>
                                        {advancedOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
                                                    {/* Amenities */}
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {AMENITIES.map(a => (
                                                                <button
                                                                    key={a.key}
                                                                    onClick={() => toggleAmenity(a.key)}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                                                        selectedAmenities.includes(a.key)
                                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                                                            : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
                                                                    }`}
                                                                >
                                                                    <span>{a.icon}</span> {a.key}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        {/* Min Bedrooms */}
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Min. Bedrooms</p>
                                                            <div className="flex gap-1.5">
                                                                {[0, 1, 2, 3, 4].map(n => (
                                                                    <button key={n} onClick={() => setMinBeds(n)}
                                                                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                                                                            minBeds === n ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50"
                                                                        }`}>
                                                                        {n === 0 ? "Any" : n}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Min Rating */}
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Min. Rating</p>
                                                            <div className="flex gap-1.5">
                                                                {[0, 3, 3.5, 4, 4.5].map(r => (
                                                                    <button key={r} onClick={() => setMinRating(r)}
                                                                        className={`px-2.5 h-9 rounded-xl text-sm font-bold transition-all ${
                                                                            minRating === r ? "bg-amber-500 text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50"
                                                                        }`}>
                                                                        {r === 0 ? "Any" : `${r}★`}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Proximity Radius */}
                                                        {location && (
                                                            <div className="col-span-2 md:col-span-1">
                                                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                                    Within {proximityKm === 0 ? "Any Distance" : `${proximityKm} km`}
                                                                </p>
                                                                <input
                                                                    type="range" min="0" max="20" step="1" value={proximityKm}
                                                                    onChange={e => setProximityKm(Number(e.target.value))}
                                                                    className="w-full accent-indigo-600"
                                                                />
                                                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                                    <span>Any</span><span>5km</span><span>10km</span><span>20km</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Property Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t("noProperties")}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{t("tryAdjusting")}</p>
                        <button onClick={clearFilters} className="btn-primary text-sm">{t("clearFilters")}</button>
                    </div>
                ) : (
                    <motion.div layout className={`${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6" : "flex flex-col gap-4"}`}>
                        <AnimatePresence>
                            {properties.map((p, i) => (
                                <motion.div
                                    key={p._id}
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <PropertyCard {...p} compact={viewMode === "list"} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Listings;
