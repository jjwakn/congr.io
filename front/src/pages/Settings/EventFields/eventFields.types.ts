import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { EventField, EventFieldType } from '@/types/event.types';
import type { FieldCondition, PersonField } from '@/types/person.types';

export interface EventFieldsListResponse {
  result: EventField[];
  total: number;
}

export interface EventFieldFormValues {
  [key: string]: string | boolean | string[] | FieldCondition[] | undefined;
  label: string;
  type: EventFieldType;
  required: boolean;
  user_fillable: boolean;
  link_person_field: boolean;
  person_field_id?: string;
  allow_multiple: boolean;
  options: string[];
  calculated_conditions: FieldCondition[];
}

export interface EventFieldFormDialogProps {
  open: boolean;
  mode: CreateEditDialogMode;
  field: EventField | null;
  eventFields: EventField[];
  personFields: PersonField[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: EventFieldFormValues) => void;
}
