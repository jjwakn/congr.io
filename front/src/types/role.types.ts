import { CommonEntity } from './common.types';

export interface Role extends CommonEntity {
  name: string;
  permissions?: {
    [key: string]: string[];
  };
  full_access: boolean;
}
