import { createContext } from 'react';
import type { LoginRequest, RegisterRequest, User } from '../../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  mockLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
