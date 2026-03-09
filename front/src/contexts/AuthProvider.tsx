import { authService } from '@services/auth';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '@/types/user.types';
import { AuthContext } from './AuthContext';
import { LoginCredentials } from './AuthContext.types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(() => authService.getUserData());

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      try {
        const sessionUser = await authService.me();
        if (!active) return;
        setUser(sessionUser);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setIsSessionLoading(false);
      }
    };

    void syncSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user: userData } = await authService.login(credentials);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSessionLoading,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
