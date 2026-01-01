import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../../lib/axios';
import type { LoginRequest, RegisterRequest, User, AuthResponse } from '../../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get<User>('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const newToken = response.data.token;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    
    // Fetch user profile immediately after login
    try {
      // Temporarily set token in headers manually for this request since the interceptor 
      // might pick up the old state or localStorage update might be async-ish in some contexts 
      // (though synchronous in browser). 
      // But standard interceptor reads from localStorage so it should be fine.
      const userResponse = await api.get<User>('/auth/me');
      setUser(userResponse.data);
    } catch (error) {
      console.error('Failed to fetch user details after login', error);
    }
  };

  const register = async (data: RegisterRequest) => {
    // Assuming register also returns a token (auto-login) or success. 
    // If it requires login after, we'd handle that. 
    // The prompt says "Register a new farmer", doesn't specify return.
    // I'll assume it creates the user. If it returns token, I'll log them in.
    // If not, I'll just return and let the UI redirect to login.
    // For now, let's assume it works like login or just succeeds.
    await api.post('/auth/register', data);
    // If auto-login is desired:
    // await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
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

