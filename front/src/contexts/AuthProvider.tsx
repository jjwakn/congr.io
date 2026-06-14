import { authService } from '@services/auth';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthPermissions } from '@/types/auth.types';
import type { PermissionAction } from '@/types/permission.types';
import { User } from '@/types/user.types';
import { AuthContext } from './AuthContext';
import { LoginCredentials } from './AuthContext.types';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const sessionData = useMemo(() => authService.getSessionData(), []);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(sessionData?.user ?? null);
  const [auth, setAuth] = useState<AuthPermissions | null>(sessionData?.auth ?? null);

  const refreshSession = useCallback(async () => {
    const session = await authService.me();
    setUser(session?.user ?? null);
    setAuth(session?.auth ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      try {
        const session = await authService.me();
        if (!active) return;
        setUser(session?.user ?? null);
        setAuth(session?.auth ?? null);
      } catch {
        if (!active) return;
        setUser(null);
        setAuth(null);
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
      const session = await authService.login(credentials);
      setUser(session.user);
      setAuth(session.auth);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void authService.logout();
    setUser(null);
    setAuth(null);
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);
  const hasPermission = useCallback(
    (section: string, action: PermissionAction) => {
      if (!auth) return false;
      if (auth.fullAccess) return true;

      return auth.permissions[section]?.includes(action) ?? false;
    },
    [auth],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        auth,
        isAuthenticated,
        isSessionLoading,
        isLoading,
        hasPermission,
        refreshSession,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
