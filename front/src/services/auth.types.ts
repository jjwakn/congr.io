import type { AuthPermissions } from '@/types/auth.types';
import type { User } from '@/types/user.types';

export interface AuthSessionResponse {
  user: User;
  auth: AuthPermissions;
}
