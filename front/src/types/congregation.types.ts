import { CommonEntity } from './common.types.js';

export interface Location extends CommonEntity {
  order: number;
  name: string;
  address: string;
}

export interface Congregation extends CommonEntity {
  id: string;
  name: string;
  type: string;
  features?: string[];
  locations: Location[];
}
