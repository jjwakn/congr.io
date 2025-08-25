import { Congregation } from '../congregation/congregation.entity';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';

export interface SetupProps {
  role: Role;
  user: User;
  congregation: Congregation;
}
