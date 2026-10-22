import React, { createContext, useContext, useMemo } from 'react';
import type { AuthUser, Permission } from '../api/client';

type AuthContextData = {
  user: AuthUser;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
};

const defaultUser: AuthUser = {
  id: 1,
  email: 'sistema@senac-df.com.br',
  role: 'ADMIN'
};

const allPermissions: Permission[] = ['VIEW', 'ALLOCATE', 'MANAGE', 'ADMIN'];

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AuthContextData>(() => ({
    user: defaultUser,
    permissions: allPermissions,
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    logout: () => {},
    can: () => true
  }), []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
