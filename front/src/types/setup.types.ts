import { Congregation } from './congregation.types.js';

export interface IsSetupResponse {
  isSetup: boolean;
  congregation?: Congregation;
}

export interface SetupSubmitResponse {
  isSetup: boolean;
  congregation: Congregation;
}

export interface SetupData {
  congregation: { name: string; type: string; timezone: string };
  features: { features: string[] };
  locations: { locations: { order: number; name: string; address: string }[] };
  admin: { username: string; password: string; name: string; roleName: string; bootstrapSecret: string };
}
