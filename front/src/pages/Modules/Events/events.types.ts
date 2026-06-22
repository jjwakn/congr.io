import type { DateSelectArg } from '@fullcalendar/core';
import type { EventType } from '@/types/event-type.types';
import type { CalendarEvent } from '@/types/event.types';
import type { EventCustomField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';

export interface EventFormValues {
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  type_id?: string;
  new_type?: { name: string; description: string };
  all_day: boolean;
  is_public: boolean;
  attendance_enabled: boolean;
  self_registration_enabled: boolean;
  image_file_id?: string;
  image_url?: string;
  custom_fields: EventCustomField[];
  type_custom_fields?: EventCustomField[];
  apply_attendance_to_type?: boolean;
  save_attendance_date: boolean;
  attendance_date_person_field_id?: string;
}

export interface EventEditorDialogProps {
  open: boolean;
  event: CalendarEvent | null;
  initialDate?: string;
  initialTypeId?: string;
  timezone: string;
  eventTypes: EventType[];
  canCreateEventType: boolean;
  canUpdateEventType: boolean;
  canViewPersonFields: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: EventFormValues, image?: File) => void;
}

export type CalendarRange = Pick<DateSelectArg, 'startStr' | 'endStr'>;

export interface EventCustomFieldsEditorProps {
  eventFields: EventCustomField[];
  typeFields: EventCustomField[];
  canUpdateEventType: boolean;
  selfRegistration: boolean;
  personFields: PersonField[];
  onChange: (value: { eventFields: EventCustomField[]; typeFields: EventCustomField[] }) => void;
}
