import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../lib/axios';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';
import i18n from '../../i18n';
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
            name: "Dev",
            surname: "User"
          });
        } else {
          // Decode JWT for fallback, but fetch real profile from backend
          try {
            const payload = jwtDecode<{ sub?: string }>(storedToken);
            if (!payload.sub) {
              logout();
              return;
            }

            try {
              const response = await api.get<User>('/users/me');
              setUser(response.data);
              if (response.data?.preferredLanguage) {
                localStorage.setItem('i18nextLng', response.data.preferredLanguage);
                i18n.changeLanguage(response.data.preferredLanguage);
              }
            } catch (err) {
              console.error('Failed to fetch user profile, falling back to token sub', err);
              setUser({ email: payload.sub });
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

    // Await User profile fetch immediately after login
    try {
      const profile = await api.get<User>('/users/me');
      setUser(profile.data);
      if (profile.data?.preferredLanguage) {
        localStorage.setItem('i18nextLng', profile.data.preferredLanguage);
        i18n.changeLanguage(profile.data.preferredLanguage);
      }
    } catch {
      setUser({ email: response.data.email || data.email });
    }
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/auth/register', data);
    // After registration, redirect to login (handled by Register.tsx)
  };

  const updateLocalUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.preferredLanguage) {
      localStorage.setItem('i18nextLng', updatedUser.preferredLanguage);
      i18n.changeLanguage(updatedUser.preferredLanguage);
    }
  }, []);

  const mockLogin = async () => {
    const fakeToken = "mock-jwt-token-dev-mode";
    const fakeUser: User = {
      id: "dev-id",
      email: "dev@solara.app",
      name: "Dev",
      surname: "User"
    };

    localStorage.setItem('token', fakeToken);
    setToken(fakeToken);
    updateLocalUser(fakeUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, mockLogin, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};
