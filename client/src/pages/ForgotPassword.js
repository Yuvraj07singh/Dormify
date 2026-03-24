import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API}/api/auth/forgot-password`, { email });
            setSent(true);
            toast.success("Reset link sent if the email is registered!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                            🔐
                        </div>
                        <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            No worries — we'll send you reset instructions.
                        </p>
                    </div>

                    {sent ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                                ✉️
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Check Your Inbox!</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                If <span className="text-white font-medium">{email}</span> is registered, a password reset link has been sent. It expires in 1 hour.
                            </p>
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium">
                                ← Back to Login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@university.edu"
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100">
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                            <div className="text-center">
                                <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    ← Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
