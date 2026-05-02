import { useState, useEffect, type ReactNode, useCallback } from 'react';
import api from '../../lib/axios';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';
import i18n from '../../i18n';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const response = await api.get<User>('/users/me');
    setUser(response.data);
    if (response.data?.preferredLanguage) {
      localStorage.setItem('i18nextLng', response.data.preferredLanguage);
      i18n.changeLanguage(response.data.preferredLanguage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if logout API fails, local auth state should be cleared.
    }
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await fetchCurrentUser();
      } catch {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser]);

  const login = async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);

    // Check if email is not verified
    if (response.data.emailVerified === false) {
      const error = new Error('Email not verified');
      (error as Error & { type: string; email: string }).type = 'EMAIL_NOT_VERIFIED';
      (error as Error & { type: string; email: string }).email = response.data.email;
      throw error;
    }
    await fetchCurrentUser();
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
    const fakeUser: User = {
      id: "dev-id",
      email: "dev@solara.app",
      name: "Dev",
      surname: "User"
    };

    updateLocalUser(fakeUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, mockLogin, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};
