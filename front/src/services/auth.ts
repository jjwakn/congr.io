import { LoginCredentials } from '@contexts/AuthContext.types';
import { HttpRequestError, ModuleType, httpRequest } from '@utils/http';
import type { AuthPermissions } from '@/types/auth.types';
import { User } from '@/types/user.types';
import i18n from '../../i18n';
import { AuthSessionResponse } from './auth.types';

const USER_DATA_KEY = 'user_data';
const AUTH_DATA_KEY = 'auth_data';
const authHttpService: ModuleType = {
  login: { url: 'auth/login', method: 'POST' },
  me: { url: 'auth/me', method: 'GET' },
  logout: { url: 'auth/logout', method: 'POST' },
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSessionResponse> {
    const data = await httpRequest<AuthSessionResponse>({
      service: authHttpService.login,
      data: {
        username: credentials.username,
        password: credentials.password,
      },
    });

    if (!data?.user || !data?.auth) throw new Error(i18n.t('auth.loginFailed'));

    this.setSessionData(data.user, data.auth);
    return data;
  },

  async me(): Promise<AuthSessionResponse | null> {
    try {
      const data = await httpRequest<AuthSessionResponse>({
        service: authHttpService.me,
      });

      if (!data?.user || !data?.auth) return null;
      this.setSessionData(data.user, data.auth);
      return data;
    } catch (error) {
      if (error instanceof HttpRequestError && error.statusCode === 401) {
        this.clearSessionData();
        return null;
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await httpRequest<{ loggedOut: boolean }>({
        service: authHttpService.logout,
      });
    } catch {
      // Keep local logout resilient even if server logout fails.
    } finally {
      this.clearSessionData();
    }
  },

  clearSessionData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_DATA_KEY);
  },

  getUserData(): User | null {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error(i18n.t('auth.log.userDataParseError'), error);
      return null;
    }
  },

  getAuthData(): AuthPermissions | null {
    try {
      const authData = localStorage.getItem(AUTH_DATA_KEY);
      return authData ? (JSON.parse(authData) as AuthPermissions) : null;
    } catch (error) {
      console.error(i18n.t('auth.log.userDataParseError'), error);
      return null;
    }
  },

  getSessionData(): AuthSessionResponse | null {
    const user = this.getUserData();
    const auth = this.getAuthData();

    if (!user || !auth) return null;

    return { user, auth };
  },

  setUserData(user: User): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  setAuthData(auth: AuthPermissions): void {
    localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(auth));
  },

  setSessionData(user: User, auth: AuthPermissions): void {
    this.setUserData(user);
    this.setAuthData(auth);
  },

  isAuthenticated(): boolean {
    return !!this.getUserData();
  },
};
