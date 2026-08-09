import { CommonEntity } from './common.types.js';
import { Congregation, Location } from './congregation.types.js';
import type { Person } from './person.types.js';
import { Role } from './role.types.js';

export interface User extends CommonEntity {
  username: string;
  password?: string;
  name: string;
  password_change_required: boolean;
  person_id?: string | null;
  person?: Person | null;
  roles: Role[];
  congregations: Congregation[];
  locations: Location[];
  preferences?: {
    page_sizes?: Record<string, number>;
    sidebar_order?: string[];
    favorites?: string[];
    time_format?: '24h' | '12h';
    column_visibility?: Record<string, string[]>;
  };
}
