import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter } from 'react-native';
const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url ?? '';

        // If error is 401/403 and we haven't retried yet and it's not a profile/auth call
        if (
            (error.response?.status === 401 || error.response?.status === 403) && 
            !originalRequest._retry && 
            !url.includes('/users/me') &&
            !url.includes('/auth/login') &&
            !url.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) {
                    // Don't log out immediately, just let the original error through
                    return Promise.reject(error);
                }

                const response = await axios.post(`${baseURL}/auth/refresh`, {}, {
                    headers: {
                        'Authorization': `Bearer ${refreshToken}`
                    }
                });

                const { token: newToken, refreshToken: newRefreshToken } = response.data;
                
                await SecureStore.setItemAsync('token', newToken);
                if (newRefreshToken) {
                    await SecureStore.setItemAsync('refreshToken', newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError: any) {
                // ONLY logout if the server explicitly says the refresh token is invalid (401 or 403)
                // If it's a network error, don't log out!
                if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
                    console.error('Refresh token rejected, logging out');
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('refreshToken');
                    DeviceEventEmitter.emit('auth:logout');
                } else {
                    console.warn('Network error during refresh, keeping session active');
                }
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
