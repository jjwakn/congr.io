import type { CommonEntity } from './common.types';
import type { JsonObject } from './json.types';
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
  custom_values: JsonObject;
}
export type PersonFieldType = 'text' | 'paragraph' | 'number' | 'yes_no' | 'options' | 'date';
export type FieldConditionOperator =
  | 'not_empty'
  | 'empty'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'age_greater_than'
  | 'age_less_than';
export interface FieldCondition {
  field_id: string;
  operator: FieldConditionOperator;
  value?: string | number | boolean | null;
}
export interface PersonField extends CommonEntity {
  id: string;
  label: string;
  type: PersonFieldType;
  required: boolean;
  allow_multiple: boolean;
  options: string[];
  calculated_conditions: FieldCondition[];
}
export interface PersonFlowStep {
  step_id: string;
  flow_key?: string | null;
  step_name: string;
  step_description: string;
  next_step_keys: string[];
  complete_previous_steps?: boolean;
  completed_at?: string | null;
}
export interface PersonFlowProgress {
  id: string;
  name: string;
  steps: PersonFlowStep[];
}
