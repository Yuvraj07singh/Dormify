import { motion } from "framer-motion";

function HomeTestimonials() {
    const testimonials = [
        { name: "Priya Sharma", college: "IIT Bombay", avatar: "PS", rating: 5, color: "bg-pink-500", text: "Found my PG in 10 minutes! The verified badges gave me confidence. Moved in within 3 days of booking. Absolutely love Dormify!" },
        { name: "Arjun Mehta", college: "Delhi University", avatar: "AM", rating: 5, color: "bg-blue-500", text: "The comparison feature is a game changer. I compared 3 PGs side by side and picked the best one. Saved me so much time!" },
        { name: "Sneha Patel", college: "IISc Bangalore", avatar: "SP", rating: 5, color: "bg-emerald-500", text: "Real-time nearby properties using my location was incredible. Found a great hostel 500m from campus that I would have never found otherwise." },
        { name: "Rohan Gupta", college: "BITS Pilani", avatar: "RG", rating: 4, color: "bg-amber-500", text: "The landlord was responsive and the booking process was seamless. Highly recommend for any student looking for accommodation near campus." },
        { name: "Ananya Krishnan", college: "Anna University", avatar: "AK", rating: 5, color: "bg-purple-500", text: "As a girl student, the verified listings and safety features gave my parents peace of mind. The chat feature to message landlords is brilliant!" },
        { name: "Vikram Singh", college: "NIT Trichy", avatar: "VS", rating: 5, color: "bg-rose-500", text: "The price filters and Best Match scores helped me find a furnished PG within my budget near campus. Highly recommend to all NIT students!" }
    ];

    return (
        <section className="py-20 overflow-hidden">
            <div className="text-center mb-12 px-6">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white">
                    Loved by <span className="gradient-text">Students Nationwide</span>
                </h2>
                <p className="mt-3 text-gray-500 dark:text-gray-400">Hear from 50,000+ students who found their perfect home on Dormify</p>
            </div>

            {/* Marquee Container */}
            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none" />

                <motion.div
                    animate={{ x: [0, -2400] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="flex gap-6 w-max"
                >
                    {[...testimonials, ...testimonials].map((review, i) => (
                        <div key={i} className="w-80 flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-lg">
                            <div className="flex gap-0.5 mb-4">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <svg key={s} className={`w-4 h-4 ${s <= review.rating ? "text-amber-400 fill-current" : "text-gray-200"}`} viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                ))}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-4 italic">"{review.text}"</p>
                            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white font-bold text-sm`}>{review.avatar}</div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{review.name}</p>
                                    <p className="text-xs text-gray-500">{review.college}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

export default HomeTestimonials;
