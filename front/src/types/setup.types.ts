import { Congregation } from './congregation.types.js';
import { SimpleImageType } from './image.types.js';

export interface IsSetupResponse {
  isSetup: boolean;
}

export interface SetupSubmitResponse {
  isSetup: boolean;
  congregation: Congregation;
}

export interface SetupData {
  congregation: { name: string; type: string };
  features: { features: string[] };
  locations: { locations: { order: number; name: string; address: string }[] };
  logo: { small: SimpleImageType | null; large: SimpleImageType | null };
  admin: { username: string; password: string; name: string; roleName: string };
}
