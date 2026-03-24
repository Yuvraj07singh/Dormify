import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import Footer from "../components/Footer";

const amenityList = ["WiFi", "AC", "Laundry", "Parking", "Gym", "Security", "Power Backup", "Water Supply"];

function StarRow({ rating }) {
    return (
        <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
                <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating || 0) ? "text-amber-400 fill-current" : "text-gray-300"}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
            ))}
            <span className="text-sm text-gray-500 ml-1">{rating?.toFixed(1) || "N/A"}</span>
        </div>
    );
}

function CompareRow({ label, icon, values, render }) {
    return (
        <div className="grid grid-cols-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
            <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                <span>{icon}</span> {label}
            </div>
            {values.map((v, i) => (
                <div key={i} className="p-4 text-sm text-gray-800 dark:text-gray-200 flex items-center justify-center text-center">
                    {render ? render(v) : (v ?? <span className="text-gray-400">—</span>)}
                </div>
            ))}
            {/* Pad empty columns */}
            {values.length < 3 && Array(3 - values.length).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="p-4 text-sm text-gray-300 flex items-center justify-center">—</div>
            ))}
        </div>
    );
}

function ComparePage() {
    const { compareList, removeFromCompare, clearCompare } = useCompare();

    if (compareList.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-6 px-6">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6 text-4xl">📋</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Properties Selected</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Go to listings and click "+ Compare" on up to 3 properties to compare them.</p>
                    <Link to="/listings" className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all">
                        Browse Listings
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950">
            {/* Header */}
            <div className="pt-28 pb-8 px-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Property <span className="text-indigo-600">Comparison</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{compareList.length} of 3 properties selected</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/listings" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-indigo-500 transition-colors">
                            + Add More
                        </Link>
                        <button onClick={clearCompare} className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors">
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Property Image Header Row */}
                    <div className="grid grid-cols-4">
                        <div className="p-6 bg-gray-50/50 dark:bg-slate-900/50 border-b border-r border-gray-100 dark:border-slate-800 flex items-center">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Property</span>
                        </div>
                        {compareList.map((p) => (
                            <div key={p._id} className="border-b border-r border-gray-100 dark:border-slate-800 last:border-r-0 relative group">
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={p.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500"}
                                        alt={p.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                                <button
                                    onClick={() => removeFromCompare(p._id)}
                                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-colors text-xs font-bold"
                                >✕</button>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p className="text-white font-bold text-sm leading-tight line-clamp-2">{p.title}</p>
                                    <p className="text-white/70 text-xs mt-0.5">{p.city || p.location}</p>
                                </div>
                            </div>
                        ))}
                        {compareList.length < 3 && Array(3 - compareList.length).fill(null).map((_, i) => (
                            <Link to="/listings" key={`slot-${i}`} className="border-b border-r border-gray-100 dark:border-slate-800 last:border-r-0 h-48 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all group">
                                <div className="w-10 h-10 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center group-hover:border-indigo-500 transition-colors text-xl">+</div>
                                <p className="text-xs font-medium">Add Property</p>
                            </Link>
                        ))}
                    </div>

                    {/* Comparison Rows */}
                    <CompareRow label="Price" icon="💰" values={compareList.map(p => p.price)} render={(v) => (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">₹{v?.toLocaleString("en-IN")}<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                    )} />
                    <CompareRow label="Rating" icon="⭐" values={compareList.map(p => p.averageRating)} render={(v) => <StarRow rating={v} />} />
                    <CompareRow label="Bedrooms" icon="🛏️" values={compareList.map(p => p.bedrooms)} render={(v) => <span className="font-semibold">{v || 1} BHK</span>} />
                    <CompareRow label="Bathrooms" icon="🚿" values={compareList.map(p => p.bathrooms)} render={(v) => <span className="font-semibold">{v || 1}</span>} />
                    <CompareRow label="Furnished" icon="🪑" values={compareList.map(p => p.furnished)} render={(v) => (
                        v ? <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-xs font-bold">Yes</span>
                          : <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 text-xs font-bold">No</span>
                    )} />
                    <CompareRow label="Type" icon="🏠" values={compareList.map(p => p.propertyType)} render={(v) => (
                        <span className="capitalize px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 text-xs font-bold">{v || "—"}</span>
                    )} />
                    <CompareRow label="City" icon="📍" values={compareList.map(p => p.city || p.location)} />
                    <CompareRow label="Nearby Uni" icon="🎓" values={compareList.map(p => p.nearbyUniversity)} />

                    {/* Amenities */}
                    <div className="grid grid-cols-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                        <div className="p-4 flex items-center gap-2 text-sm font-bold text-indigo-600 col-span-4 border-b border-gray-100 dark:border-slate-800">
                            🛋️ Amenities
                        </div>
                    </div>
                    {amenityList.map((amenity) => (
                        <CompareRow key={amenity} label={amenity} icon="" values={compareList.map(p => p.amenities?.includes(amenity))} render={(v) => (
                            v ? <span className="text-emerald-500 text-lg">✓</span> : <span className="text-gray-300 text-lg">✗</span>
                        )} />
                    ))}

                    {/* CTA Row */}
                    <div className="grid grid-cols-4 bg-gray-50/50 dark:bg-slate-900/50">
                        <div className="p-6 flex items-center text-sm font-semibold text-gray-500">Book Now</div>
                        {compareList.map((p) => (
                            <div key={p._id} className="p-4 flex items-center justify-center border-l border-gray-100 dark:border-slate-800">
                                <Link to={`/property/${p._id}`} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 text-sm w-full text-center">
                                    View Details
                                </Link>
                            </div>
                        ))}
                        {compareList.length < 3 && Array(3 - compareList.length).fill(null).map((_, i) => (
                            <div key={`cta-empty-${i}`} className="p-4 border-l border-gray-100 dark:border-slate-800" />
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default ComparePage;
