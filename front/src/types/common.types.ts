import { User } from './user.types';

export interface CommonEntity {
  id: string;
  enabled: boolean;
  created_at?: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  created_by?: User | null;
  updated_by?: User | null;
  deleted_by?: User | null;
}
