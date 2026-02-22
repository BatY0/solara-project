import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../lib/axios';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';
import { AuthContext } from './AuthContextDefinition';

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
          try {
            const payload = jwtDecode<{ sub?: string }>(storedToken);
            if (payload.sub) {
              setUser({ email: payload.sub });
            } else {
              console.error('Token missing sub claim');
              logout();
            }
          } catch {
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

    // Check if email is not verified
    if (response.data.emailVerified === false) {
      const error = new Error('Email not verified');
      (error as Error & { type: string; email: string }).type = 'EMAIL_NOT_VERIFIED';
      (error as Error & { type: string; email: string }).email = response.data.email;
      throw error;
    }

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
