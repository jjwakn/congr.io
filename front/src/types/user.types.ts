import { CommonEntity } from './common.types.js';
import { Congregation, Location } from './congregation.types.js';
import { Role } from './role.types.js';

export interface User extends CommonEntity {
  username: string;
  password?: string;
  name: string;
  roles: Role[];
  congregations: Congregation[];
  locations: Location[];
}
