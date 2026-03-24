// Skeleton shimmer animation components for beautiful loading states

const shimmer = `
    @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
    }
`;

function SkeletonBase({ className = "", style = {} }) {
    return (
        <>
            <style>{shimmer}</style>
            <div
                className={`rounded-xl ${className}`}
                style={{
                    background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
                    backgroundSize: "1000px 100%",
                    animation: "shimmer 2s infinite linear",
                    ...style
                }}
            />
        </>
    );
}

export function PropertyCardSkeleton() {
    return (
        <div className="rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-xl">
            <SkeletonBase style={{ height: "220px", borderRadius: 0 }} />
            <div className="p-5 space-y-3">
                <SkeletonBase style={{ height: "20px", width: "75%", borderRadius: "8px" }} />
                <SkeletonBase style={{ height: "14px", width: "55%", borderRadius: "8px" }} />
                <SkeletonBase style={{ height: "14px", width: "40%", borderRadius: "8px" }} />
                <div className="flex justify-between pt-2">
                    <SkeletonBase style={{ height: "18px", width: "80px", borderRadius: "8px" }} />
                    <SkeletonBase style={{ height: "36px", width: "100px", borderRadius: "10px" }} />
                </div>
            </div>
        </div>
    );
}

export function PropertyDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                <SkeletonBase style={{ height: "450px", borderRadius: "24px" }} />
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                        <SkeletonBase style={{ height: "36px", width: "60%", borderRadius: "12px" }} />
                        <SkeletonBase style={{ height: "18px", width: "40%", borderRadius: "8px" }} />
                        <SkeletonBase style={{ height: "120px", borderRadius: "16px" }} />
                    </div>
                    <div className="space-y-4">
                        <SkeletonBase style={{ height: "300px", borderRadius: "24px" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-3">
            <SkeletonBase style={{ height: "16px", width: "50%", borderRadius: "8px" }} />
            <SkeletonBase style={{ height: "36px", width: "70%", borderRadius: "10px" }} />
        </div>
    );
}
