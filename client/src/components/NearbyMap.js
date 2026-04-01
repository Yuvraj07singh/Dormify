import { useState, useEffect, useContext, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import axios from "axios";
import * as turf from "@turf/turf";
import { GeoJSON } from "react-leaflet";
import { LanguageContext } from "../context/LanguageContext";
import { LocationContext } from "../context/LocationContext";
import API_URL from "../config/api";

// Leaflet defaults fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const dbIcon = new L.DivIcon({
    className: "",
    html: `<div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); border: 3px solid white;">
        <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
});

const liveIcon = new L.DivIcon({
    className: "",
    html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); border: 3px solid white;">
        <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="white"><path d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2.02-2.82C6.76 5.7 9.13 4 12 4c2.87 0 5.24 1.7 5.98 4.18C19.16 8.59 20 9.69 20 11c0 1.66-1.34 3-3 3H7zm-2 4h14v2H5v-2z"/></svg>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => { if (center) map.setView(center, 13, { animate: true }); }, [center, map]);
    return null;
}

// Haversine formula
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Helper: Map OSM type tags to human-readable category labels
const getOsmCategory = (tags) => {
    if (tags?.tourism === "hotel") return "Hotel";
    if (tags?.tourism === "hostel") return "Hostel";
    if (tags?.tourism === "guest_house") return "Guest House";
    if (tags?.tourism === "motel") return "Motel";
    if (tags?.tourism === "apartment") return "Service Apartment";
    if (tags?.building === "dormitory") return "Dormitory";
    if (tags?.building === "apartments") return "Apartment Block";
    if (tags?.building === "residential") return "Residential";
    if (tags?.amenity === "shelter") return "Shelter";
    if (tags?.building === "hotel") return "Hotel";
    return tags?.tourism || tags?.building || "Accommodation";
};

// Helper: Extract real address from OSM tags
const getOsmAddress = (tags) => {
    const parts = [];
    if (tags?.["addr:housename"]) parts.push(tags["addr:housename"]);
    if (tags?.["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
    if (tags?.["addr:street"]) parts.push(tags["addr:street"]);
    if (tags?.["addr:suburb"] || tags?.["addr:neighbourhood"]) parts.push(tags["addr:suburb"] || tags["addr:neighbourhood"]);
    if (tags?.["addr:city"]) parts.push(tags["addr:city"]);
    if (tags?.["addr:postcode"]) parts.push(tags["addr:postcode"]);
    return parts.length > 0 ? parts.join(", ") : null;
};

// Helper: Extract phone/website from OSM data
const getOsmContact = (tags) => ({
    phone: tags?.phone || tags?.["contact:phone"] || null,
    website: tags?.website || tags?.["contact:website"] || tags?.url || null,
    email: tags?.email || tags?.["contact:email"] || null,
});

function NearbyMap() {
    const navigate = useNavigate();
    const { t } = useContext(LanguageContext);
    const { location, fetchLocation, isLocating, error, address, searchLocation, searchSuggestions, setSearchSuggestions, isSearching, setManualLocation } = useContext(LocationContext);

    const [dbProperties, setDbProperties] = useState([]);
    const [liveProperties, setLiveProperties] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [searchZone, setSearchZone] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLive, setSelectedLive] = useState(null);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    const centerCoords = location ? [location.lat, location.lng] : [20.5937, 78.9629];
    const locationEnabled = !!location;

    // Handle search input with debounce
    const handleSearchInput = (value) => {
        setSearchQuery(value);
        clearTimeout(debounceRef.current);
        if (value.length >= 2) {
            debounceRef.current = setTimeout(() => {
                searchLocation(value);
                setShowSuggestions(true);
            }, 400);
        } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Select a search suggestion
    const selectSuggestion = (suggestion) => {
        setManualLocation(suggestion.lat, suggestion.lng, suggestion.displayName.split(",").slice(0, 2).join(","));
        setSearchQuery(suggestion.displayName.split(",").slice(0, 2).join(","));
        setShowSuggestions(false);
        setSearchSuggestions([]);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (!location) return;

        const fetchDbProperties = async () => {
            try {
                const resDb = await fetch(`${API_URL}/api/property?lat=${location.lat}&lng=${location.lng}&radius=5000`);
                if (!resDb.ok) throw new Error("DB fetch failed");
                let data = await resDb.json();
                const dbList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                setDbProperties(dbList.map(p => ({
                    ...p, distance: getDistance(location.lat, location.lng, p.latitude, p.longitude)
                })));
            } catch (err) {
                console.warn("DB Properties fetch warning:", err);
            }
        };

        const fetchOsmProperties = async () => {
            try {
                // Broader Overpass query: nodes AND ways, more categories, up to 10km radius, output 50 results
                const query = `[out:json][timeout:25];
(
  nwr["tourism"="hotel"](around:10000,${location.lat},${location.lng});
  nwr["tourism"="hostel"](around:10000,${location.lat},${location.lng});
  nwr["tourism"="guest_house"](around:10000,${location.lat},${location.lng});
  nwr["tourism"="motel"](around:10000,${location.lat},${location.lng});
  nwr["tourism"="apartment"](around:10000,${location.lat},${location.lng});
  nwr["building"="dormitory"](around:10000,${location.lat},${location.lng});
  nwr["building"="apartments"](around:8000,${location.lat},${location.lng});
  nwr["building"="hotel"](around:10000,${location.lat},${location.lng});
  nwr["amenity"="shelter"](around:5000,${location.lat},${location.lng});
);
out center 50;`;

                let osmRes;
                const endpoints = [
                    "https://overpass-api.de/api/interpreter",
                    "https://overpass.kumi.systems/api/interpreter",
                ];

                for (const endpoint of endpoints) {
                    try {
                        osmRes = await axios.get(`${endpoint}?data=${encodeURIComponent(query)}`, { timeout: 15000 });
                        if (osmRes?.data?.elements?.length > 0) break;
                    } catch {
                        continue;
                    }
                }

                if (osmRes?.data?.elements) {
                    const seen = new Set();
                    const live = osmRes.data.elements
                        .filter(el => {
                            // For ways/relations, use center coordinates
                            const lat = el.lat || el.center?.lat;
                            const lon = el.lon || el.center?.lon;
                            if (!lat || !lon) return false;
                            // Deduplicate by name+location
                            const key = `${(el.tags?.name || "").toLowerCase()}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        })
                        .map(el => {
                            const lat = el.lat || el.center?.lat;
                            const lon = el.lon || el.center?.lon;
                            const tags = el.tags || {};
                            const category = getOsmCategory(tags);
                            const osmAddress = getOsmAddress(tags);
                            const contact = getOsmContact(tags);

                            return {
                                id: `osm-${el.id}`,
                                osmId: el.id,
                                title: tags.name || tags["name:en"] || `${category} near ${address || "you"}`,
                                category,
                                type: tags.tourism || tags.building || "accommodation",
                                latitude: lat,
                                longitude: lon,
                                address: osmAddress,
                                phone: contact.phone,
                                website: contact.website,
                                email: contact.email,
                                stars: tags.stars ? parseInt(tags.stars) : null,
                                rooms: tags.rooms ? parseInt(tags.rooms) : null,
                                wheelchair: tags.wheelchair || null,
                                internetAccess: tags.internet_access || tags["internet_access:fee"] || null,
                                checkIn: tags["check_in"] || null,
                                checkOut: tags["check_out"] || null,
                                operator: tags.operator || null,
                                openingHours: tags.opening_hours || null,
                                description: tags.description || tags["description:en"] || null,
                                distance: getDistance(location.lat, location.lng, lat, lon),
                                isLive: true,
                                rawTags: tags,
                            };
                        })
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 30);

                    setLiveProperties(live);
                }
            } catch (err) {
                console.warn("Live OSM Properties fetch warning:", err);
            }
        };

        const executeFetches = async () => {
            setLoadingData(true);

            // Set search zone immediately
            const center = [location.lng, location.lat];
            const circlePolygon = turf.circle(center, 10, { steps: 64, units: 'kilometers' });
            setSearchZone(circlePolygon);

            // Fetch concurrently
            await Promise.allSettled([fetchDbProperties(), fetchOsmProperties()]);

            setLoadingData(false);
        };

        executeFetches();
    }, [location]);

    const allProperties = [...dbProperties, ...liveProperties].sort((a, b) => a.distance - b.distance).slice(0, 30);

    return (
        <section className="py-24 px-4 md:px-6 bg-gray-50/50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                        {t("nearbyProperties")} <span className="gradient-text">{t("propertiesText")}</span>
                    </h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Search any location or use GPS — See verified listings & live public data near you.
                    </p>
                </motion.div>

                {/* Location Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto mb-8"
                >
                    <div className="relative" ref={searchRef}>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchInput(e.target.value)}
                                    onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder="Search any city, locality, or university..."
                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg text-sm"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={fetchLocation}
                                disabled={isLocating}
                                className="px-4 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all text-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                {isLocating ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                                Use GPS
                            </button>
                        </div>

                        {/* Search Suggestions Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                                >
                                    {searchSuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => selectSuggestion(s)}
                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-0"
                                        >
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">
                                                        {s.displayName.split(",").slice(0, 3).join(",")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {s.city && `${s.city}, `}{s.state}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {!locationEnabled ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{t("enableLocation")}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Search a city above or enable GPS to find nearby properties</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold flex items-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                                    Verified ({dbProperties.length})
                                </span>
                                <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Data ({liveProperties.length})
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                {address || "Current Location"}
                            </span>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 relative">
                                {loadingData && <div className="absolute inset-0 z-[1000] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}
                                <MapContainer center={centerCoords} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapUpdater center={centerCoords} />

                                    <Marker position={centerCoords} icon={new L.DivIcon({ className: "", html: `<div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 6px rgba(59,130,246,0.3);"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] })}>
                                        <Popup><span className="font-semibold text-sm">Your Location</span></Popup>
                                    </Marker>

                                    {/* GIS Spatial Boundary Box */}
                                    {searchZone && (
                                        <GeoJSON
                                            key={location.lat + "-" + location.lng}
                                            data={searchZone}
                                            style={{
                                                color: '#6366f1',
                                                weight: 2,
                                                opacity: 0.6,
                                                fillColor: '#6366f1',
                                                fillOpacity: 0.05,
                                                dashArray: "5, 10"
                                            }}
                                        />
                                    )}

                                    {allProperties.map(p => (
                                        <Marker key={p._id || p.id} position={[p.latitude, p.longitude]} icon={p.isLive ? liveIcon : dbIcon}>
                                            <Popup>
                                                <div className="map-marker-popup p-1" style={{ minWidth: 240, maxWidth: 300 }}>
                                                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
                                                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                                                        {p.isLive ? (
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live — {p.category}
                                                            </span>
                                                        ) : (
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.source === "99acres" ? "bg-blue-100 text-blue-700" :
                                                                    p.source === "JustDial" ? "bg-yellow-100 text-yellow-700" :
                                                                        p.source === "MagicBricks" ? "bg-red-100 text-red-700" :
                                                                            "bg-indigo-100 text-indigo-700"
                                                                }`}>{p.source || "Verified"}</span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-sm text-gray-800 mb-1 leading-tight">{p.title}</h4>
                                                    {p.address && <p className="text-xs text-gray-500 mb-1.5 leading-snug">{p.address}</p>}
                                                    {p.isLive && (
                                                        <div className="space-y-1 mb-2">
                                                            {p.stars && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-500">Rating:</span>
                                                                    <span className="text-xs font-bold text-amber-500">{"★".repeat(p.stars)}{"☆".repeat(5 - p.stars)}</span>
                                                                </div>
                                                            )}
                                                            {p.rooms && <p className="text-xs text-gray-500">Rooms: <span className="font-semibold text-gray-700">{p.rooms}</span></p>}
                                                            {p.operator && <p className="text-xs text-gray-500">Operator: <span className="font-semibold text-gray-700">{p.operator}</span></p>}
                                                            {p.phone && <p className="text-xs text-gray-500">Phone: <a href={`tel:${p.phone}`} className="font-semibold text-indigo-600 hover:underline">{p.phone}</a></p>}
                                                            {p.website && <p className="text-xs text-gray-500 truncate">Web: <a href={p.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">{p.website.replace(/^https?:\/\//, "").split("/")[0]}</a></p>}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-gray-100">
                                                        <span className="text-xs font-medium text-gray-500">{p.distance?.toFixed(1)} km away</span>
                                                        {p.isLive ? (
                                                            <button onClick={() => setSelectedLive(p)} className="py-1 px-2.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">View Details</button>
                                                        ) : (
                                                            <button onClick={() => navigate(`/property/${p._id}`)} className="py-1 px-2.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">View Listing</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                                {allProperties.length === 0 && !loadingData && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-sm font-medium text-gray-400">No properties found nearby.</p>
                                        <p className="text-xs text-gray-400 mt-1">Try a different location or increase your search radius.</p>
                                    </div>
                                )}
                                {allProperties.map((p, i) => (
                                    <motion.div
                                        key={p._id || p.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => p.isLive ? setSelectedLive(p) : navigate(`/property/${p._id}`)}
                                        className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${p.isLive ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:shadow-md" : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:shadow-lg hover:border-indigo-300"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${p.isLive ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-indigo-100 dark:bg-indigo-500/20"}`}>
                                            {p.isLive ? (
                                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2.02-2.82C6.76 5.7 9.13 4 12 4c2.87 0 5.24 1.7 5.98 4.18C19.16 8.59 20 9.69 20 11c0 1.66-1.34 3-3 3H7zm-2 4h14v2H5v-2z"/></svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{p.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs text-gray-500">{p.distance?.toFixed(1)} km</span>
                                                {p.isLive ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        {p.category}
                                                    </span>
                                                ) : p.source && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.source === "99acres" ? "text-blue-500 bg-blue-50" :
                                                            p.source === "JustDial" ? "text-yellow-600 bg-yellow-50" :
                                                                "text-red-500 bg-red-50"
                                                        }`}>{p.source}</span>
                                                )}
                                            </div>
                                            {p.isLive && p.address && (
                                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{p.address}</p>
                                            )}
                                            {!p.isLive && <p className="text-sm font-bold mt-1 text-gray-700 dark:text-gray-300">₹{p.price?.toLocaleString("en-IN")}/mo</p>}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ─── Live Property Detail Modal ─── */}
            <AnimatePresence>
                {selectedLive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedLive(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-slate-700"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 relative">
                                <button onClick={() => setSelectedLive(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Data
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">{selectedLive.category}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">{selectedLive.title}</h3>
                                {selectedLive.address && <p className="text-emerald-100 text-sm mt-1">{selectedLive.address}</p>}
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Distance</p>
                                        <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">{selectedLive.distance?.toFixed(1)} km</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Type</p>
                                        <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5 capitalize">{selectedLive.type}</p>
                                    </div>
                                    {selectedLive.stars ? (
                                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Rating</p>
                                            <p className="text-base font-bold text-amber-500 mt-0.5">{"★".repeat(selectedLive.stars)}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Source</p>
                                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">OSM</p>
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-2.5">
                                    {selectedLive.operator && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            <div><p className="text-xs text-gray-400">Operator</p><p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedLive.operator}</p></div>
                                        </div>
                                    )}
                                    {selectedLive.rooms && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                            <div><p className="text-xs text-gray-400">Rooms</p><p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedLive.rooms}</p></div>
                                        </div>
                                    )}
                                    {selectedLive.phone && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <div><p className="text-xs text-gray-400">Phone</p><a href={`tel:${selectedLive.phone}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{selectedLive.phone}</a></div>
                                        </div>
                                    )}
                                    {selectedLive.email && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <div><p className="text-xs text-gray-400">Email</p><a href={`mailto:${selectedLive.email}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{selectedLive.email}</a></div>
                                        </div>
                                    )}
                                    {selectedLive.website && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                            <div><p className="text-xs text-gray-400">Website</p><a href={selectedLive.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block max-w-[250px]">{selectedLive.website.replace(/^https?:\/\//, "")}</a></div>
                                        </div>
                                    )}
                                    {selectedLive.openingHours && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <div><p className="text-xs text-gray-400">Hours</p><p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedLive.openingHours}</p></div>
                                        </div>
                                    )}
                                    {(selectedLive.checkIn || selectedLive.checkOut) && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <div>
                                                <p className="text-xs text-gray-400">Check-in / Check-out</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedLive.checkIn || "—"} / {selectedLive.checkOut || "—"}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedLive.wheelchair && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            <div><p className="text-xs text-gray-400">Accessibility</p><p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{selectedLive.wheelchair} wheelchair access</p></div>
                                        </div>
                                    )}
                                    {selectedLive.internetAccess && (
                                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                                            <div><p className="text-xs text-gray-400">Internet</p><p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{selectedLive.internetAccess}</p></div>
                                        </div>
                                    )}
                                    {selectedLive.description && (
                                        <div className="pt-2">
                                            <p className="text-xs text-gray-400 mb-1">Description</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedLive.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLive.latitude},${selectedLive.longitude}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold text-center shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all"
                                    >
                                        Get Directions
                                    </a>
                                    <a
                                        href={`https://www.openstreetmap.org/node/${selectedLive.osmId}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                                    >
                                        View on OSM
                                    </a>
                                </div>

                                <p className="text-[10px] text-gray-400 text-center">Data sourced from OpenStreetMap contributors under ODbL license.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export default NearbyMap;
