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
  has_logo_small?: boolean;
  has_logo_large?: boolean;
  locations: Location[];
}
