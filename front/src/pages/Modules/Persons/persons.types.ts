import type { Person, PersonField, PersonFieldType } from '@/types/person.types';

export interface PersonFormValues {
  [key: string]: unknown;
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
  custom_values: Record<string, unknown>;
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
  [key: string]: string | boolean | string[];
  label: string;
  type: PersonFieldType;
  required: boolean;
  options: string[];
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
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}
export interface PersonDetailsDialogProps {
  person: Person;
  fields: PersonField[];
  onClose: () => void;
}
