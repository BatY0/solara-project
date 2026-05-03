import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';
import { LoginRequest, RegisterRequest, User, AuthResponse } from '../types/auth';
import { pushTokensService } from '../services/pushTokensService';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    updateLocalUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const logout = useCallback(async () => {
        // 1. Immediately clear in-memory state to trigger navigation change
        setToken(null);
        setUser(null);

        // 2. Clear token from storage first
        try {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('refreshToken');
        } catch (error) {
            console.error('Failed to clear stored tokens during logout', error);
        }

        // 3. Try cleaning up push tokens (may fail if token was invalid)
        try {
            const expoPushToken = await SecureStore.getItemAsync('expoPushToken');
            if (expoPushToken) {
                // If the token was 403, this will fail, but we catch it.
                await pushTokensService.unregisterExpoPushToken(expoPushToken).catch(() => {});
                await SecureStore.deleteItemAsync('expoPushToken');
            }
        } catch (error) {
            console.error('Failed to unregister push token during logout', error);
        }
    }, []);

    const updateLocalUser = useCallback((updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : prev);
    }, []);

    const fetchAndSetUser = useCallback(async (token: string) => {
        try {
            const payload = jwtDecode<{ sub?: string }>(token);
            if (!payload.sub) {
                console.error('Token missing sub claim');
                await logout();
                return;
            }
            try {
                const response = await api.get<User>('/users/me');
                setUser(response.data);
            } catch (err: any) {
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    console.error('Token rejected by server, logging out', err);
                    await logout();
                    return;
                }
                console.error('Failed to fetch user profile, falling back to token sub', err);
                setUser({ email: payload.sub });
            }
        } catch (error) {
            console.error('Failed to decode token', error);
            await logout();
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('token');
                if (storedToken) {
                    setToken(storedToken);
                    await fetchAndSetUser(storedToken);
                }
            } catch (error) {
                console.error('Error initializing auth', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        const subscription = DeviceEventEmitter.addListener('auth:logout', () => {
            logout();
        });

        return () => subscription.remove();
    }, [fetchAndSetUser, logout]);

    const login = async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>('/auth/login', data);

        if (response.data.emailVerified === false) {
            const error = new Error('Email not verified');
            (error as any).type = 'EMAIL_NOT_VERIFIED';
            (error as any).email = response.data.email;
            throw error;
        }

        const newToken = response.data.token;
        const newRefreshToken = response.data.refreshToken;
        await SecureStore.setItemAsync('token', newToken);
        if (newRefreshToken) {
            await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }
        setToken(newToken);

        try {
            const profile = await api.get<User>('/users/me');
            setUser(profile.data);
        } catch {
            setUser({ email: response.data.email || data.email });
        }
    };

    const register = async (data: RegisterRequest) => {
        await api.post('/auth/register', data);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateLocalUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
