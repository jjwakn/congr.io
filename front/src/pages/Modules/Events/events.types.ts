import type { DateSelectArg } from '@fullcalendar/core';
import { DateTime } from 'luxon';
import type { EventType } from '@/types/event-type.types';
import type { CalendarEvent } from '@/types/event.types';
import type { EventCustomField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';

export interface EventFormValues {
  name: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  type_id: string;
  all_day: boolean;
  is_public: boolean;
  attendance_enabled: boolean;
  self_registration_enabled: boolean;
  image_file_id?: string;
  image_url?: string;
  custom_fields: EventCustomField[];
  event_fields: EventCustomField[];
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
  mode?: 'event' | 'event-type';
  readOnlyTypeFields?: boolean;
  canAddFields?: boolean;
  onChange: (value: { eventFields: EventCustomField[]; typeFields: EventCustomField[] }) => void;
}

export interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  timezone: string;
  imageUrl?: string;
  use12HourTime: boolean;
  onClose: () => void;
  onAddToCalendar: (event: CalendarEvent) => void;
  onShare: (event: CalendarEvent) => void;
}

export type EventCalendarTitlePickerPanel = 'days' | 'months' | 'weeks' | 'years';
export type EventCalendarDateTime = ReturnType<typeof DateTime.now>;

export interface EventCalendarTitlePickerDayCell {
  date: EventCalendarDateTime;
  isoDate: string;
  isCurrentMonth: boolean;
}

export interface EventCalendarTitlePickerWeekRow {
  endDate: EventCalendarDateTime;
  isSelected: boolean;
  startDate: EventCalendarDateTime;
}

export interface EventCalendarTitlePickerPopoverProps {
  anchorEl: HTMLElement | null;
  currentViewDate: Date;
  currentViewType: string;
  locale: string;
  nextLabel: string;
  previousLabel: string;
  selectTitleLabel: string;
  onClose: () => void;
  onNavigate: (viewType: string, date: Date) => void;
  open: boolean;
  weekStartsOn: number;
}
