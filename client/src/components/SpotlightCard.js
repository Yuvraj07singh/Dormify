import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SpotlightCard({ children, className = "", spotlightColor = "rgba(99, 102, 241, 0.15)" }) {
    const divRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden ${className}`}
        >
            {/* The base card border/background (optional base styles are applied via className prop) */}
            
            {/* Spotlight Gradient overlay */}
            {isMounted && (
                <motion.div
                    animate={{ opacity }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 40%)`,
                    }}
                />
            )}
            
            {/* Content Container to keep z-index above spotlight */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
}
