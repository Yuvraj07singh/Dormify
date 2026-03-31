import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
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
    const { location } = useContext(LocationContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [propertyType, setPropertyType] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [furnished, setFurnished] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

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
            // Handle both paginated { data: [...] } and plain array responses
            const dbList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
            allData = [...dbList];

            // 2. Fetch Live OSM Properties if Location is set
            if (location) {
                const query = `[out:json];(node["tourism"="hotel"](around:5000,${location.lat},${location.lng});node["tourism"="hostel"](around:5000,${location.lat},${location.lng});node["building"="dormitory"](around:5000,${location.lat},${location.lng});node["building"="apartments"](around:5000,${location.lat},${location.lng}););out 30;`;
                const osmRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

                if (osmRes.data && osmRes.data.elements) {
                    const liveData = osmRes.data.elements.map(el => ({
                        _id: `osm-${el.id}`,
                        title: el.tags?.name || (el.tags?.tourism === "hotel" ? "Local Hotel" : "Apartment/Dormitory"),
                        propertyType: el.tags?.tourism === "hotel" ? "private-room" : "apartment",
                        price: Math.floor(Math.random() * 15000) + 5000,
                        location: "Nearby (Live Data)",
                        city: "Sensor Area",
                        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"],
                        bedrooms: 1,
                        bathrooms: 1,
                        isLive: true,
                        averageRating: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
                        totalReviews: Math.floor(Math.random() * 100) + 1,
                        latitude: el.lat,
                        longitude: el.lon,
                        distance: getDistance(location.lat, location.lng, el.lat, el.lon)
                    }));

                    // Apply filters to live data
                    let filteredLive = liveData;
                    if (propertyType) filteredLive = filteredLive.filter(p => p.propertyType === propertyType);
                    if (priceRange) {
                        const [min, max] = priceRange.split("-");
                        filteredLive = filteredLive.filter(p => p.price >= Number(min) && p.price <= (max === '999999' ? Infinity : Number(max)));
                    }

                    allData = [...allData, ...filteredLive];
                }
            }

            // 3. Sort Properties
            if (sortBy === "price-low") allData.sort((a, b) => a.price - b.price);
            else if (sortBy === "price-high") allData.sort((a, b) => b.price - a.price);
            else if (sortBy === "rating") allData.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            else if (location && sortBy === "newest") {
                // If sorting by nearest (default when location is active)
                allData.forEach(p => {
                    if (p.distance === undefined) {
                        p.distance = getDistance(location.lat, location.lng, p.latitude, p.longitude) || 9999;
                    }
                });
                allData.sort((a, b) => a.distance - b.distance);
            }

            setProperties(allData);
        } catch (err) {
            console.error(err);
            setProperties([]);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProperties(); }, [search, propertyType, priceRange, furnished, sortBy, location]);
    useEffect(() => { const q = searchParams.get("search"); if (q) setSearch(q); }, [searchParams]);

    const clearFilters = () => { setSearch(""); setPropertyType(""); setPriceRange(""); setFurnished(false); setSortBy("newest"); setSearchParams({}); };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="pt-28 pb-8 px-6 bg-gradient-to-b from-indigo-50 dark:from-slate-900 to-transparent">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white">
                            {search ? <>{t("resultsFor")} "<span className="gradient-text">{search}</span>"</> : <>{t("allListings")} <span className="gradient-text">{t("listingsSuffix")}</span></>}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{loading ? t("searching") : `${properties.length} ${t("propertiesFound")}`}</p>
                    </motion.div>
                    {/* Sticky Premium Filter Bar */}
                    <div className="sticky top-[88px] z-40 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-4 md:p-6 mt-8 -mx-4 md:mx-0 rounded-[2rem] border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300">
                        <div className="flex flex-col md:flex-row gap-4 relative">
                            <div className="flex-1 relative group">
                                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchCity")} className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner transition-all duration-300 font-medium" />
                            </div>
                            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="px-5 py-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium">
                                {propertyTypes.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                            </select>
                            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="px-5 py-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium">
                                <option value="">{t("anyPrice")}</option>
                                <option value="0-8000">Under ₹8,000</option>
                                <option value="8000-15000">₹8,000 - ₹15,000</option>
                                <option value="15000-25000">₹15,000 - ₹25,000</option>
                                <option value="25000-999999">₹25,000+</option>
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-5 py-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 border border-white/30 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium">
                                <option value="newest">{t("newest")}</option>
                                <option value="price-low">{t("priceLow")}</option>
                                <option value="price-high">{t("priceHigh")}</option>
                                <option value="rating">{t("topRated")}</option>
                            </select>
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setFurnished(!furnished)}>
                                <div className={`w-12 h-7 rounded-full px-1 flex items-center transition-colors duration-300 ${furnished ? "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "bg-gray-300 dark:bg-slate-600"}`}>
                                    <motion.div animate={{ x: furnished ? 20 : 0 }} className="w-5 h-5 rounded-full bg-white shadow-md" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">{t("furnished")}</span>
                            </label>
                            {(search || propertyType || priceRange || furnished) && (
                                <button onClick={clearFilters} className="text-sm px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold transition-colors">{t("clearAll")}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 pb-24">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t("noProperties")}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t("tryAdjusting")}</p>
                        <button onClick={clearFilters} className="btn-primary">{t("clearFilters")}</button>
                    </div>
                ) : (
                    <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {properties.map((p, i) => (
                                <motion.div
                                    key={p._id}
                                    layout
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        delay: i * 0.08,
                                        duration: 0.6,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    <PropertyCard {...p} />
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
