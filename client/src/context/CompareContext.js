import { createContext, useContext, useState, useCallback } from "react";
import toast from "react-hot-toast";

const CompareContext = createContext();

const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
    const [compareList, setCompareList] = useState([]);

    const addToCompare = useCallback((property) => {
        setCompareList((prev) => {
            if (prev.find((p) => p._id === property._id)) {
                toast("Already in comparison!", { icon: "📋" });
                return prev;
            }
            if (prev.length >= MAX_COMPARE) {
                toast.error(`Max ${MAX_COMPARE} properties can be compared at once.`);
                return prev;
            }
            toast.success(`"${property.title}" added to comparison!`);
            return [...prev, property];
        });
    }, []);

    const removeFromCompare = useCallback((id) => {
        setCompareList((prev) => prev.filter((p) => p._id !== id));
    }, []);

    const clearCompare = useCallback(() => {
        setCompareList([]);
    }, []);

    const isInCompare = useCallback((id) => {
        return compareList.some((p) => p._id === id);
    }, [compareList]);

    return (
        <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    return useContext(CompareContext);
}
