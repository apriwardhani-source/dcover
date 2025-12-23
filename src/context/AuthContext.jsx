import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = api.getToken();
        if (token) {
            try {
                const userData = await api.getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error('Auth check failed:', error);
                api.logout();
            }
        }
        setLoading(false);
    };

    const logout = () => {
        api.logout();
        setUser(null);
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }
        return { success: true };
    };

    const value = {
        user,
        setUser,
        userData: user,
        loading,
        isUserAdmin: user?.role === 'admin',
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
