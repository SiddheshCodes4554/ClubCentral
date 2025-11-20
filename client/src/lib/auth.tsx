import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import type { PermissionSet } from '@shared/permissions';
import { queryClient } from './queryClient';

type InstitutionPermissionSet = {
  canManageInstitution?: boolean;
  canCreateClubs?: boolean;
  canAssignPresident?: boolean;
  canManageAdmins?: boolean;
  canCommentOnEvents?: boolean;
  scope?: 'all' | 'department';
};

export type ClubUserSession = {
  kind: 'club';
  id: string;
  name: string;
  email: string;
  role: string;
  isPresident: boolean;
  clubId: string;
  permissions?: PermissionSet;
};

export type InstitutionUserSession = {
  kind: 'institution';
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId: string;
  department: string | null;
  permissions: InstitutionPermissionSet;
};

type User = ClubUserSession | InstitutionUserSession;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  sessionType: 'club' | 'institution' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsed = JSON.parse(storedUser) as User;
        if (parsed && (parsed as any).kind) {
          setUser(parsed);
        }
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    // Clear all React Query cache to prevent data leakage between users
    if (typeof window !== 'undefined') {
      queryClient.clear();
    }
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Clear all React Query cache to prevent data leakage between users
    if (typeof window !== 'undefined') {
      queryClient.clear();
    }
    setToken(null);
    setUser(null);
    setLocation('/login');
  };

  const sessionType = user?.kind ?? null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, sessionType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
