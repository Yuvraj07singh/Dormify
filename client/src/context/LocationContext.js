import React, { createContext, useState } from "react";
import axios from "axios";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null); // { lat, lng }
    const [address, setAddress] = useState("Set Location");
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // GPS-based location
    const fetchLocation = () => {
        setIsLocating(true);
        setError(null);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                    try {
                        const res = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                            { headers: { "Accept-Language": "en" } }
                        );
                        if (res.data && res.data.address) {
                            const addr = res.data.address;
                            const name = addr.neighbourhood || addr.suburb || addr.city || addr.town || addr.county || addr.state;
                            setAddress(`${name}, ${addr.country_code?.toUpperCase()}`);
                        } else {
                            setAddress("Location Found");
                        }
                    } catch (err) {
                        console.error("Geocoding failed", err);
                        setAddress("Location Found (Unknown Area)");
                    } finally {
                        setIsLocating(false);
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setError("Location permission denied or unavailable.");
                    setIsLocating(false);
                    setAddress("Location Failed");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
            setIsLocating(false);
            setAddress("Unsupported");
        }
    };

    // Search any location via Nominatim forward geocoding
    const searchLocation = async (query) => {
        if (!query || query.length < 2) {
            setSearchSuggestions([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`,
                { headers: { "Accept-Language": "en" } }
            );
            if (res.data && Array.isArray(res.data)) {
                setSearchSuggestions(res.data.map(r => ({
                    displayName: r.display_name,
                    lat: parseFloat(r.lat),
                    lng: parseFloat(r.lon),
                    city: r.address?.city || r.address?.town || r.address?.state_district || "",
                    state: r.address?.state || ""
                })));
            }
        } catch (err) {
            console.error("Location search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Set location manually from search result
    const setManualLocation = (lat, lng, displayName) => {
        setLocation({ lat, lng });
        setAddress(displayName || "Selected Location");
        setSearchSuggestions([]);
    };

    return (
        <LocationContext.Provider value={{
            location, address, isLocating, error, fetchLocation,
            searchLocation, searchSuggestions, setSearchSuggestions, isSearching,
            setManualLocation
        }}>
            {children}
        </LocationContext.Provider>
    );
};
