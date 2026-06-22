import type { CommonEntity } from './common.types.js';
import type { EventCustomField } from './event.types.js';

export interface EventType extends CommonEntity {
  id: string;
  congregation_id: string;
  name: string;
  description: string;
  enabled: boolean;
  attendance_enabled?: boolean;
  custom_fields?: EventCustomField[];
  color?: string;
  save_attendance_date?: boolean;
  attendance_date_person_field_id?: string | null;
}
