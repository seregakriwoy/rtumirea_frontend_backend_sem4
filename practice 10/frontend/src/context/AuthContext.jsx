import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

useEffect(() => {
    const checkAuth = async () => {
        if (accessToken) {
            try {
                const response = await api.get('/auth/me').catch(err => {
                    console.error('Error in /auth/me:', err);
                    return null;
                });
                
                if (response && response.data) {
                    setUser(response.data);
                } else {
                    logout();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                logout();
            }
        }
        setLoading(false);
    };

    checkAuth();
}, []);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

    useEffect(() => {
        if (accessToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [accessToken]);

    useEffect(() => {
        const checkAuth = async () => {
            if (accessToken) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    if (refreshToken) {
                        try {
                            const refreshResponse = await api.post('/auth/refresh', { refreshToken });
                            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                            setAccessToken(newAccessToken);
                            setRefreshToken(newRefreshToken);
                            localStorage.setItem('accessToken', newAccessToken);
                            localStorage.setItem('refreshToken', newRefreshToken);
                            
                            const userResponse = await api.get('/auth/me');
                            setUser(userResponse.data);
                        } catch (refreshError) {
                            logout();
                        }
                    } else {
                        logout();
                    }
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
            
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            const userResponse = await api.get('/auth/me');
            setUser(userResponse.data);
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await api.post('/auth/register', { username, password });
            return await login(username, password);
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};