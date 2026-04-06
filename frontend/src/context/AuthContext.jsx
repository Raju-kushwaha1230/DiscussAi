import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axiosApi';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const checkAuth = async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/profile');
            if (response.data.success) {
                setUser(response.data.user);
                setToken(storedToken);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { data } = response;
            if (data.success) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An error occurred during login';
            console.error('Login error:', error);
            return { success: false, message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await api.post('/auth/register',{name, email, password });
            const { data } = response;
            if (data.success) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An error occurred during registration';
            console.error('Registration error:', error);
            return { success: false, message };
        }
    };

    const handleGoogleLogin = async (access_token) => {
        try {
            const response = await api.post('/auth/google', { access_token });
            const { data } = response;
            if (data.success) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An error occurred during Google login';
            console.error('Google login error:', error);
            return { success: false, message };
        }
    };

    const [aiPreferences, setAiPreferences] = useState(() => {
        const saved = localStorage.getItem('aiPreferences');
        return saved ? JSON.parse(saved) : { complexity: 'standard', engine: 'neural' };
    });

    const updateAiPreferences = (newPrefs) => {
        const updated = { ...aiPreferences, ...newPrefs };
        setAiPreferences(updated);
        localStorage.setItem('aiPreferences', JSON.stringify(updated));
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        loading,
        token,
        aiPreferences,
        updateAiPreferences,
        login,
        register,
        handleGoogleLogin,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
