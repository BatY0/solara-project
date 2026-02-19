import { useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../../lib/axios';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';
import { AuthContext } from './AuthContextDefinition';

// Helper to decode JWT payload without a library
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        if (storedToken === "mock-jwt-token-dev-mode") {
          setUser({
            id: "dev-id",
            email: "dev@solara.app",
            firstName: "Dev",
            lastName: "User"
          });
        } else {
          // Decode JWT to extract user email from the 'sub' claim
          const payload = decodeJwtPayload(storedToken);
          if (payload && payload.sub) {
            setUser({ email: payload.sub as string });
          } else {
            // Token is invalid or malformed
            console.error('Failed to decode token');
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const newToken = response.data.token;

    localStorage.setItem('token', newToken);
    setToken(newToken);

    // Use the email from the login response directly
    setUser({ email: response.data.email || data.email });
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
    // After registration, redirect to login (handled by Register.tsx)
  };

  const mockLogin = async () => {
    const fakeToken = "mock-jwt-token-dev-mode";
    const fakeUser: User = {
      id: "dev-id",
      email: "dev@solara.app",
      firstName: "Dev",
      lastName: "User"
    };

    localStorage.setItem('token', fakeToken);
    setToken(fakeToken);
    setUser(fakeUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
