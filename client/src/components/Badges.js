// Reusable badge components displayed on property cards and detail pages

export function VerifiedBadge({ size = "sm" }) {
    const sizes = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1"
    };
    return (
        <span className={`inline-flex items-center gap-1 ${sizes[size]} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
        </span>
    );
}

export function ViewCountBadge({ count = 0 }) {
    if (!count || count < 2) return null;
    return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {count} views
        </span>
    );
}

export function SourceBadge({ source }) {
    const configs = {
        "JustDial": { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
        "99acres": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
        "MagicBricks": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
        "Direct": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" }
    };
    const c = configs[source] || configs["Direct"];

    return (
        <span className={`inline-flex items-center text-xs px-2 py-0.5 ${c.bg} ${c.text} border ${c.border} rounded-full font-medium`}>
            {source || "Direct"}
        </span>
    );
}

export function PopularBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold">
            🔥 Popular
        </span>
    );
}
