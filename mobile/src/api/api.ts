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
        const url = error.config?.url ?? '';
        // Only force-logout on 401 for non-profile endpoints.
        // A 401 on /users/me is handled gracefully by AuthContext.
        if (error.response?.status === 401 && !url.includes('/users/me')) {
            await SecureStore.deleteItemAsync('token');
            DeviceEventEmitter.emit('auth:logout');
        }
        return Promise.reject(error);
    }
);

export default api;
