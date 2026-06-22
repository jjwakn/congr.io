import type { CommonEntity } from './common.types';
import type { EventType } from './event-type.types';

export type EventFieldType = 'text' | 'paragraph' | 'number' | 'switch' | 'single_option' | 'multiple_options';

export interface EventCustomField {
  id: string;
  label: string;
  type: EventFieldType;
  required: boolean;
  options: string[];
  user_fillable: boolean;
  person_field_id?: string;
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
