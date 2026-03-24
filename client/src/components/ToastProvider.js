import { Toaster } from "react-hot-toast";

// Drop this once inside App.js — it renders all toasts globally
export default function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 3500,
                style: {
                    borderRadius: "12px",
                    background: "#1e293b",
                    color: "#f1f5f9",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "12px 16px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                },
                success: {
                    iconTheme: { primary: "#10b981", secondary: "#fff" }
                },
                error: {
                    iconTheme: { primary: "#ef4444", secondary: "#fff" }
                }
            }}
        />
    );
}
