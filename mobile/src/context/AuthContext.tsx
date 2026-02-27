import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';
import { LoginRequest, RegisterRequest, User, AuthResponse } from '../types/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const logout = useCallback(async () => {
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
    }, []);

    const decodeAndSetUser = useCallback((token: string) => {
        try {
            const payload = jwtDecode<{ sub?: string }>(token);
            if (payload.sub) {
                setUser({ email: payload.sub });
            } else {
                console.error('Token missing sub claim');
                logout();
            }
        } catch (error) {
            console.error('Failed to decode token', error);
            logout();
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('token');
                if (storedToken) {
                    setToken(storedToken);
                    decodeAndSetUser(storedToken);
                }
            } catch (error) {
                console.error('Error initializing auth', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [decodeAndSetUser]);

    const login = async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>('/auth/login', data);

        if (response.data.emailVerified === false) {
            const error = new Error('Email not verified');
            (error as any).type = 'EMAIL_NOT_VERIFIED';
            (error as any).email = response.data.email;
            throw error;
        }

        const newToken = response.data.token;
        await SecureStore.setItemAsync('token', newToken);
        setToken(newToken);
        setUser({ email: response.data.email || data.email });
    };

    const register = async (data: RegisterRequest) => {
        await api.post('/auth/register', data);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
