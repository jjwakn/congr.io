import type { JsonObject } from '@/types/json.types';
import type { FieldCondition, Person, PersonField, PersonFieldType } from '@/types/person.types';

export interface PersonFormValues {
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  married_name?: string;
  phone?: string;
  birthdate?: string;
  age?: number;
  email?: string;
  user_id?: string;
  regenerate_code?: boolean;
  custom_values: JsonObject;
}
export interface PersonFormDialogProps {
  open: boolean;
  person: Person | null;
  fields: PersonField[];
  canCreateFields: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: PersonFormValues) => void;
  onCreateField: (values: PersonFieldFormValues) => Promise<PersonField | null>;
}
export interface PersonFieldFormValues {
  [key: string]: string | boolean | string[] | FieldCondition[];
  label: string;
  type: PersonFieldType;
  required: boolean;
  allow_multiple: boolean;
  options: string[];
  calculated_conditions: FieldCondition[];
}
export interface PersonFieldFormDialogProps {
  open: boolean;
  field: PersonField | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: PersonFieldFormValues) => void;
}
export interface PersonCustomFieldsProps {
  fields: PersonField[];
  standardValues?: JsonObject;
  values: JsonObject;
  onChange: (values: JsonObject) => void;
}
export interface PersonDetailsDialogProps {
  person: Person;
  fields: PersonField[];
  onClose: () => void;
}
