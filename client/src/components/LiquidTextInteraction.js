import { useState } from "react";

export default function LiquidTextInteraction({ text1, text2, text3 }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative cursor-default select-none group"
        >
            {/* BASE LAYER: Solid Text smoothly morphing into Purple Free-Style Gradient on hover */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-[1.1] tracking-tight transition-all duration-700 ease-in-out text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-fuchsia-400">
                {text1}<br/>{text2}<br/>{text3}
            </h1>
        </div>
    );
}
