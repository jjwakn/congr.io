import { ReactNode, useCallback, useEffect, useState } from 'react';
import { AuthContext, LoginCredentials } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    // const token = authService.getToken();
    // const userData = authService.getUserData();

    // if (token && userData) {
    //   setUser(userData);
    // }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      checkAuth();
    };
  }, [checkAuth]);

  const login = async ({ email, password }: LoginCredentials) => {
    console.log({ email, password });
    // setIsLoading(true);
    // try {
    //   const { user: userData } = await authService.login(credentials);
    //   setUser(userData);
    // } catch (error) {
    //   throw error;
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const logout = () => {
    // authService.logout();
    // setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: null,
        isAuthenticated: false,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
