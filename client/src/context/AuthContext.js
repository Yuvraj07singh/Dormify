import { createContext, useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../config/api";

export const AuthContext = createContext();

const API = `${API_URL}/api`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${API}/auth/me`);
            setUser(res.data);
        } catch (err) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post(`${API}/auth/login`, { email, password });
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        return res.data;
    };

    const register = async (formData) => {
        const res = await axios.post(`${API}/auth/register`, formData);
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
    };

    const toggleSaveProperty = async (propertyId) => {
        const res = await axios.post(`${API}/auth/save/${propertyId}`);
        setUser(prev => ({ ...prev, savedProperties: res.data.savedProperties }));
        return res.data;
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading,
            login, register, logout, toggleSaveProperty
        }}>
            {children}
        </AuthContext.Provider>
    );
};
