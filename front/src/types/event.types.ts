import type { CommonEntity } from './common.types';
import type { EventType } from './event-type.types';
import type { FieldCondition } from './person.types';

export type EventFieldType = 'text' | 'paragraph' | 'number' | 'yes_no' | 'options' | 'date';

export interface EventCustomField {
  id: string;
  label: string;
  type: EventFieldType;
  required: boolean;
  options: string[];
  allow_multiple?: boolean;
  user_fillable: boolean;
  link_person_field?: boolean;
  event_field_id?: string;
  person_field_id?: string;
  calculated_conditions?: FieldCondition[];
}

export interface EventField extends CommonEntity, EventCustomField {
  congregation_id: string;
}

export interface CalendarEvent extends CommonEntity {
  id: string;
  congregation_id: string;
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  event_type_id: string;
  type?: EventType | null;
  all_day: boolean;
  is_public: boolean;
  public_id?: string | null;
  image_file_id?: string | null;
  image_url?: string | null;
  attendance_enabled: boolean;
  self_registration_enabled: boolean;
  registration_locked: boolean;
  custom_fields: EventCustomField[];
  save_attendance_date: boolean;
  attendance_date_person_field_id?: string | null;
}

export interface EventsListResponse {
  result: CalendarEvent[];
  total: number;
}
