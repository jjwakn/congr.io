import { User } from './user.types';

export interface CommonEntity {
  id: string;
  enabled: boolean;
  created_at?: Date | string;
  updated_at?: Date | string | null;
  deleted_at?: Date | string | null;
  created_by?: User | null;
  updated_by?: User | null;
  deleted_by?: User | null;
}
