import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { setApiToken } from '../api/index.js';

// Создаем отдельный экземпляр axios для авторизации
const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
    }
});

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Функция для установки токена в заголовки обоих apiClient
    const setAuthToken = (token) => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setApiToken(token);
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
            setApiToken(null);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            console.log('Token found:', !!token);
            
            if (token) {
                try {
                    // Устанавливаем токен для запросов
                    setAuthToken(token);
                    
                    const response = await apiClient.get('/auth/me');
                    console.log('User data:', response.data);
                    setUser(response.data);
                } catch (error) {
                    console.error('Auth error:', error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setAuthToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            const { accessToken, refreshToken } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // Устанавливаем токен для будущих запросов
            setAuthToken(accessToken);
            
            const userResponse = await apiClient.get('/auth/me');
            setUser(userResponse.data);
            
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            // Добавляем проверку на существование error.response
            const errorMessage = error.response?.data?.error || error.message || 'Login failed';
            return { success: false, error: errorMessage };
        }
    };

    const register = async (username, password) => {
        try {
            const response = await apiClient.post('/auth/register', { username, password });
            // После регистрации сразу логинимся
            return await login(username, password);
        } catch (error) {
            console.error('Register error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAuthToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};