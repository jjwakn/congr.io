import { CommonEntity } from './common.types';
import { Congregation, Location } from './congregation.types';
import { Role } from './role.types';

export interface User extends CommonEntity {
  username: string;
  password?: string;
  name: string;
  roles: Role[];
  congregations: Congregation[];
  locations: Location[];
}
