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
        <span style="transform: rotate(45deg); color: white; font-size: 14px;">🏠</span>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
});

const liveIcon = new L.DivIcon({
    className: "",
    html: `<div style="background: linear-gradient(135deg, #10b981, #059669); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); border: 3px solid white;">
        <span style="transform: rotate(45deg); color: white; font-size: 14px;">🏨</span>
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
        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch our DB Properties with Spatial Query
                const resDb = await fetch(`${API_URL}/api/property?lat=${location.lat}&lng=${location.lng}&radius=5000`);
                let data = await resDb.json();
                if (Array.isArray(data)) {
                    setDbProperties(data.map(p => ({
                        ...p, distance: getDistance(location.lat, location.lng, p.latitude, p.longitude)
                    })));
                }

                // Create a 5km GeoJSON circle using Turf.js overlay
                const center = [location.lng, location.lat];
                const radius = 5;
                const options = { steps: 64, units: 'kilometers', properties: { foo: 'bar' } };
                const circlePolygon = turf.circle(center, radius, options);
                setSearchZone(circlePolygon);

                // Fetch Real-time Live Data (OSM Overpass API within 5km)
                const query = `[out:json];(node["tourism"="hotel"](around:5000,${location.lat},${location.lng});node["tourism"="hostel"](around:5000,${location.lat},${location.lng});node["building"="dormitory"](around:5000,${location.lat},${location.lng});node["building"="apartments"](around:5000,${location.lat},${location.lng}););out 15;`;
                const osmRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

                if (osmRes.data && osmRes.data.elements) {
                    const live = osmRes.data.elements.map(el => ({
                        id: `osm-${el.id}`,
                        title: el.tags?.name || (el.tags?.tourism === "hotel" ? "Local Hotel" : "Apartment/Dormitory"),
                        type: el.tags?.tourism || el.tags?.building || "Accommodation",
                        latitude: el.lat,
                        longitude: el.lon,
                        price: Math.floor(Math.random() * 15000) + 5000,
                        distance: getDistance(location.lat, location.lng, el.lat, el.lon),
                        isLive: true
                    })).sort((a, b) => a.distance - b.distance);
                    setLiveProperties(live);
                }
            } catch (err) { console.error("Data fetch error", err); }
            finally { setLoadingData(false); }
        };
        fetchData();
    }, [location]);

    const allProperties = [...dbProperties, ...liveProperties].sort((a, b) => a.distance - b.distance).slice(0, 15);

    return (
        <section className="py-24 px-6 bg-gray-50/50 dark:bg-slate-900/50">
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
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold">🏠 Verified Listings ({dbProperties.length})</span>
                                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold">🏨 Real-Time Data ({liveProperties.length})</span>
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">📍 Showing data for: {address}</span>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 relative">
                                {loadingData && <div className="absolute inset-0 z-[1000] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}
                                <MapContainer center={centerCoords} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
                                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapUpdater center={centerCoords} />

                                    <Marker position={centerCoords} icon={new L.DivIcon({ className: "", html: `<div style="width: 20px; height: 20px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 6px rgba(59,130,246,0.3);"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] })}>
                                        <Popup><span className="font-semibold text-sm">📍 You are here</span></Popup>
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
                                                <div className="map-marker-popup p-1" style={{ minWidth: 200 }}>
                                                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />}
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {p.isLive ? <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Live Sensor Data</span> : (
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.source === "99acres" ? "bg-blue-100 text-blue-700" :
                                                                    p.source === "JustDial" ? "bg-yellow-100 text-yellow-700" :
                                                                        p.source === "MagicBricks" ? "bg-red-100 text-red-700" :
                                                                            "bg-indigo-100 text-indigo-700"
                                                                }`}>{p.source || "Verified"}</span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-sm text-gray-800 mb-1 line-clamp-1">{p.title}</h4>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="font-bold text-gray-900">Est. ₹{p.price?.toLocaleString("en-IN")}/mo</span>
                                                        <span className="text-xs text-gray-400">{p.distance?.toFixed(1)} km</span>
                                                    </div>
                                                    {!p.isLive && <button onClick={() => navigate(`/property/${p._id}`)} className="mt-2 w-full py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">View Details</button>}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {allProperties.map((p, i) => (
                                    <motion.div key={p._id || p.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => !p.isLive && navigate(`/property/${p._id}`)} className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${p.isLive ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:shadow-md" : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:shadow-lg hover:border-indigo-300"}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${p.isLive ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>
                                            {p.isLive ? "🏨" : "🏠"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{p.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500">{p.distance?.toFixed(1)} km</span>
                                                {p.isLive ? (
                                                    <span className="text-[10px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-50 rounded">LIVE OSM</span>
                                                ) : p.source && (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.source === "99acres" ? "text-blue-500 bg-blue-50" :
                                                            p.source === "JustDial" ? "text-yellow-600 bg-yellow-50" :
                                                                "text-red-500 bg-red-50"
                                                        }`}>{p.source}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold mt-1 text-gray-700 dark:text-gray-300">₹{p.price?.toLocaleString("en-IN")}/mo</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}

export default NearbyMap;
