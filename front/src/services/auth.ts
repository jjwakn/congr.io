import i18n from '../../i18n';
import { LoginCredentials } from '../contexts/AuthContext.types';
import { User } from '../types/user.types';
import { HttpRequestError, ModuleType, httpRequest } from '../utils/http';
import { LoginResponse } from './auth.types';

const USER_DATA_KEY = 'user_data';
const authHttpService: ModuleType = {
  login: { url: 'auth/login', method: 'POST' },
  me: { url: 'auth/me', method: 'GET' },
  logout: { url: 'auth/logout', method: 'POST' },
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    const data = await httpRequest<LoginResponse>({
      service: authHttpService.login,
      data: {
        username: credentials.username,
        password: credentials.password,
      },
    });

    if (!data?.user) throw new Error(i18n.t('auth.loginFailed'));

    this.setUserData(data.user);

    return {
      user: data.user,
    };
  },

  async me(): Promise<User | null> {
    try {
      const data = await httpRequest<{ user: User }>({
        service: authHttpService.me,
      });

      if (!data?.user) return null;
      this.setUserData(data.user);
      return data.user;
    } catch (error) {
      if (error instanceof HttpRequestError && error.statusCode === 401) {
        this.clearUserData();
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
      this.clearUserData();
    }
  },

  clearUserData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem(USER_DATA_KEY);
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

  setUserData(user: User): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  isAuthenticated(): boolean {
    return !!this.getUserData();
  },
};
