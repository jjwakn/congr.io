import type { AuthPermissions } from '@/types/auth.types';
import type { PermissionAction } from '@/types/permission.types';
import type { User } from '@/types/user.types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  auth: AuthPermissions | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  isLoading: boolean;
  hasPermission: (section: string, action: PermissionAction) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
