import { motion } from "framer-motion";

function SkeletonCard() {
    return (
        <div className="property-card overflow-hidden">
            <div className="h-56 skeleton" />
            <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-4 w-1/2 skeleton" />
                <div className="h-4 w-2/3 skeleton" />
                <div className="flex gap-4 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <div className="h-4 w-16 skeleton" />
                    <div className="h-4 w-16 skeleton" />
                    <div className="h-4 w-20 skeleton" />
                </div>
            </div>
        </div>
    );
}

export default SkeletonCard;
