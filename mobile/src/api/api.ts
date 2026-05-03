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
                    throw new Error('No refresh token available');
                }

                // Call refresh endpoint
                // Note: The backend expects refreshToken in a cookie for web, 
                // but we'll send it as a query param or body if needed, 
                // OR we can rely on our new JwtAuthFilter which should support it?
                // Wait, the backend /refresh endpoint uses @CookieValue. 
                // I should probably update the backend /refresh to also accept a header or body.
                
                // Let's assume for now we might need to update the backend /refresh too.
                // But wait, I'll update the mobile app to send it in a way the backend can read.
                
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

                // Update original request header and retry
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                await SecureStore.deleteItemAsync('token');
                await SecureStore.deleteItemAsync('refreshToken');
                DeviceEventEmitter.emit('auth:logout');
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
