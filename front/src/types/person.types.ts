import type { CommonEntity } from './common.types';
import type { User } from './user.types';

export interface Person extends CommonEntity {
  id: string;
  code: string;
  code_history?: Array<{ code: string; generated_at: string }>;
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  married_name?: string;
  phone: string;
  birthdate?: string;
  registered_age?: number;
  age_recorded_at?: string;
  email?: string;
  user_id?: string;
  user?: User;
  custom_values: Record<string, unknown>;
}
export type PersonFieldType =
  | 'text'
  | 'paragraph'
  | 'number'
  | 'switch'
  | 'single_option'
  | 'multiple_options'
  | 'date';
export interface PersonField extends CommonEntity {
  id: string;
  label: string;
  type: PersonFieldType;
  required: boolean;
  options: string[];
}
export interface PersonFlowStep {
  step_id: string;
  flow_key?: string | null;
  step_name: string;
  step_description: string;
  next_step_keys: string[];
  completed_at?: string | null;
}
export interface PersonFlowProgress {
  id: string;
  name: string;
  steps: PersonFlowStep[];
}
