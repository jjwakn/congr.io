import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { EventField, EventFieldType } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';

export interface EventFieldsListResponse {
  result: EventField[];
  total: number;
}

export interface EventFieldFormValues {
  [key: string]: string | boolean | string[] | undefined;
  label: string;
  type: EventFieldType;
  required: boolean;
  user_fillable: boolean;
  person_field_id?: string;
  options: string[];
}

export interface EventFieldFormDialogProps {
  open: boolean;
  mode: CreateEditDialogMode;
  field: EventField | null;
  personFields: PersonField[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: EventFieldFormValues) => void;
}
