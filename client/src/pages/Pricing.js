import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const plans = [
    {
        name: "Student Free",
        price: "₹0",
        period: "/month",
        badge: null,
        description: "Everything a student needs to find their perfect PG.",
        color: "from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900",
        border: "border-gray-200 dark:border-slate-700",
        btnClass: "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100",
        features: [
            "Browse unlimited listings",
            "Advanced search & filters",
            "Property comparison (up to 2)",
            "Save 5 searches",
            "Direct messaging with landlords",
            "Basic booking management",
        ],
        missing: ["AI Best Match Score", "Priority listings", "Virtual tours"],
    },
    {
        name: "Student Pro",
        price: "₹199",
        period: "/month",
        badge: "Most Popular",
        badgeColor: "bg-indigo-600",
        description: "The smartest way to find your perfect home near campus.",
        color: "from-indigo-600 to-purple-700",
        border: "border-indigo-500",
        isDark: true,
        btnClass: "bg-white text-indigo-700 hover:bg-indigo-50 font-bold",
        features: [
            "Everything in Student Free",
            "🏆 AI Best Match Score (unlimited)",
            "Property comparison (up to 5)",
            "Unlimited saved searches",
            "Priority customer support",
            "Early access to new listings",
            "Virtual tours & 360° views",
            "Move-in cost calculator",
        ],
        missing: [],
    },
    {
        name: "Landlord Pro",
        price: "₹999",
        period: "/month",
        badge: "Best for Landlords",
        badgeColor: "bg-amber-500",
        description: "List, manage, and fill your properties faster than ever.",
        color: "from-gray-100 to-gray-50 dark:from-slate-800 dark:to-slate-900",
        border: "border-amber-400 dark:border-amber-500",
        btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 font-bold shadow-lg shadow-amber-500/30",
        features: [
            "Up to 20 property listings",
            "Verified Landlord badge",
            "Instant inquiry notifications",
            "Booking & tenant management",
            "Analytics dashboard",
            "Featured placement in search results",
            "Cloudinary CDN image hosting",
            "Razorpay payment integration",
        ],
        missing: [],
    },
];

const faqs = [
    {
        q: "Can I cancel anytime?",
        a: "Yes. All plans are month-to-month with no long-term commitment. Cancel anytime from your account settings.",
    },
    {
        q: "Is my payment data secure?",
        a: "Absolutely. Payments are processed via Razorpay, a PCI-DSS compliant gateway. We never store your card details.",
    },
    {
        q: "What happens if I exceed my listing limit?",
        a: "You will receive an in-app notification. You can upgrade your plan or archive older listings to make room.",
    },
    {
        q: "Do you offer discounts for NGOs or student housing trusts?",
        a: "Yes. Contact us at support@dormify.in and we will set up a custom plan with discounted rates.",
    },
];

export default function Pricing() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-700">

            {/* Hero */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6">
                            Simple, Transparent Pricing
                        </span>
                        <h1 className="text-5xl md:text-6xl font-display font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                            The right plan for{" "}
                            <span className="gradient-text">every student</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Start for free. Upgrade when you need more. No hidden fees, no surprises.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Plans */}
            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                                className={`relative rounded-3xl border-2 ${plan.border} overflow-hidden`}
                            >
                                <div className={`bg-gradient-to-br ${plan.color} p-8 h-full flex flex-col`}>
                                    {plan.badge && (
                                        <span className={`absolute top-5 right-5 px-3 py-1 rounded-full text-xs font-bold text-white ${plan.badgeColor}`}>
                                            {plan.badge}
                                        </span>
                                    )}

                                    <div className="mb-8">
                                        <h3 className={`text-xl font-bold mb-1 ${plan.isDark ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                            {plan.name}
                                        </h3>
                                        <p className={`text-sm mb-6 ${plan.isDark ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}>
                                            {plan.description}
                                        </p>
                                        <div className={`flex items-baseline gap-1 ${plan.isDark ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                            <span className="text-5xl font-extrabold">{plan.price}</span>
                                            <span className={`text-base font-normal ${plan.isDark ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}>
                                                {plan.period}
                                            </span>
                                        </div>
                                    </div>

                                    <Link to="/register" className={`w-full py-3.5 rounded-2xl text-center font-semibold transition-all duration-200 mb-8 block ${plan.btnClass}`}>
                                        Get Started →
                                    </Link>

                                    <ul className="space-y-3 flex-1">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                                <span className={`text-sm ${plan.isDark ? "text-indigo-100" : "text-gray-700 dark:text-gray-300"}`}>{f}</span>
                                            </li>
                                        ))}
                                        {plan.missing.map((f) => (
                                            <li key={f} className="flex items-start gap-3 opacity-40">
                                                <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700"
                            >
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-16 shadow-2xl shadow-indigo-500/30">
                    <h2 className="text-4xl font-display font-bold text-white mb-4">Ready to find your perfect PG?</h2>
                    <p className="text-indigo-200 text-lg mb-8">Join 50,000+ students who found their home through Dormify.</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to="/register">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg">
                                Get Started Free
                            </motion.button>
                        </Link>
                        <Link to="/listings">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-4 rounded-2xl bg-white/10 text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-colors">
                                Browse Listings
                            </motion.button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
