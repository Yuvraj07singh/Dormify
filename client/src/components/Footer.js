import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

function Footer() {
    const { t } = useContext(LanguageContext);

    return (
        <footer className="relative bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative max-w-7xl mx-auto px-6 py-20 z-10">
                <div className="grid md:grid-cols-12 gap-12 lg:gap-8">
                    {/* Brand & Newsletter */}
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="text-white font-bold text-xl">D</span>
                            </div>
                            <span className="text-3xl font-display font-bold text-gray-900 dark:text-white">Dormify</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 pr-4">
                            India's smartest way for students to find their perfect home near campus. Verified listings, transparent pricing, and zero broker hassle.
                        </p>
                        
                        {/* Newsletter Input */}
                        <div className="relative group">
                            <input 
                                type="email" 
                                placeholder="Subscribe to updates..." 
                                className="w-full pl-5 pr-32 py-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                            <button className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-colors shadow-md">
                                Subscribe
                            </button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-3 lg:col-span-2 lg:col-start-6">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 tracking-wide">{t("explore")}</h4>
                        <ul className="space-y-4">
                            {[t("browseListingsFooter"), t("howItWorksFooter"), t("pricing"), t("studentGuide")].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium relative group">
                                        <span>{item}</span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Landlords */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 tracking-wide">{t("landlords")}</h4>
                        <ul className="space-y-4">
                            {[t("listProperty"), t("landlordDashboard"), t("verification"), t("support")].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium relative group">
                                        <span>{item}</span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 tracking-wide">{t("connect")}</h4>
                        <ul className="space-y-4">
                            {["help@dormify.in", "Twitter", "Instagram", "LinkedIn"].map(item => (
                                <li key={item}>
                                    <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("copyright")}
                    </p>
                    <div className="flex gap-6">
                        {[t("privacy"), t("terms"), t("cookies")].map(item => (
                            <a key={item} href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{item}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
