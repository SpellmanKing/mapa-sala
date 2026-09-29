import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AUTH_UNAUTHORIZED_EVENT,
  AuthApi,
  authToken,
  type AuthUser,
  type Permission
} from '../api/client';

type AuthContextData = {
  user: AuthUser | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    authToken.clear();
    setUser(null);
    setPermissions([]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);

    if (!authToken.get()) {
      setIsLoading(false);
    } else {
      AuthApi.session()
        .then(session => {
          setUser(session.user);
          setPermissions(session.permissions);
        })
        .catch(clearSession)
        .finally(() => setIsLoading(false));
    }

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await AuthApi.login(email, password);
    authToken.set(session.token);
    setUser(session.user);
    setPermissions(session.permissions);
  }, []);

  const can = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  return (
    <AuthContext.Provider value={{
      user,
      permissions,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout: clearSession,
      can
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
