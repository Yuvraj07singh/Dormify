import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Register() {
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", university: "", phone: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await register(form);
            sessionStorage.setItem("showWelcomeModal", "true");
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed.");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 px-4 py-24 transition-all duration-700">
            <motion.div animate={{ x: [0, 20, 0], y: [0, -15, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-20 left-20 w-72 h-72 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-500/20 blur-3xl" />

            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7 }}
                className="relative w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 p-8 md:p-10">

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        <span className="text-white text-2xl font-bold">D</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-gray-800 dark:text-white">Create Account</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Join <span className="font-semibold gradient-text">Dormify</span> and find your perfect home</p>
                </motion.div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm text-center">
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                            {["student", "landlord"].map(role => (
                                <button key={role} type="button" onClick={() => setForm({...form, role})}
                                    className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all ${form.role === role
                                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>
                                    {role === "student" ? "🎓 Student" : "🏠 Landlord"}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required className="input-field" />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                            <input name="phone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} className="input-field" />
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input name="email" type="email" placeholder="you@university.edu" value={form.email} onChange={handleChange} required className="input-field" />
                    </motion.div>

                    {form.role === "student" && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">University</label>
                            <input name="university" placeholder="e.g. MIT, Stanford..." value={form.university} onChange={handleChange} className="input-field" />
                        </motion.div>
                    )}

                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                        <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="input-field" />
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-lg disabled:opacity-60">
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </motion.div>
                </form>

                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                    <span className="text-sm text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                </div>

                <p className="text-center text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold gradient-text hover:opacity-80 transition-opacity">Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Register;
