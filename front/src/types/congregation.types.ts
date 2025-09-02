import { CommonEntity } from './common.types';

export interface Location extends CommonEntity {
  order: number;
  name: string;
  address: string;
}

export interface Congregation extends CommonEntity {
  id: string;
  name: string;
  type: string;
  locations: Location[];
}
