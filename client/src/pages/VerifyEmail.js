import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API_URL from "../config/api";

function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState("verifying");

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
                    method: "POST",
                });
                
                if (res.ok) {
                    setStatus("success");
                } else {
                    const data = await res.json();
                    setStatus("error");
                }
            } catch (err) {
                setStatus("error");
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-slate-950">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-xl border border-gray-100 dark:border-slate-800"
            >
                {status === "verifying" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                        <h2 className="text-2xl font-bold mb-2 dark:text-white">Verifying Email...</h2>
                        <p className="text-gray-500">Please wait while we confirm your email address.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 dark:text-white">Email Verified!</h2>
                        <p className="text-gray-500 mb-8">Your account is now fully active. You can continue using Dormify.</p>
                        <Link to="/" className="w-full inline-block py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors">
                            Go to Homepage
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 dark:text-white">Verification Failed</h2>
                        <p className="text-gray-500 mb-8">The link is invalid or has expired.</p>
                        <Link to="/" className="w-full inline-block py-3 px-4 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">
                            Return Home
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default VerifyEmail;
