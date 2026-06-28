import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { EventType } from '@/types/event-type.types';
import type { EventCustomField } from '@/types/event.types';

export interface EventTypesListResponse {
  result: EventType[];
  total: number;
}

export interface UseEventTypesListProps {
  enabled?: boolean;
}

export interface UseEventTypesListResult extends EventTypesListResponse {
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  search: string;
  debouncedSearch: string;
  setSearch: (value: string) => void;
  sort: string;
  direction: ListDirection;
  page: number;
  pageSize: number;
  handleSort: (value: string) => void;
  handleChangePage: (value: number) => void;
  handleChangeRowsPerPage: (value: number) => void;
}

export interface EventTypeFormValues {
  [key: string]: string | boolean | number | EventCustomField[] | undefined;
  name: string;
  description: string;
  attendance_enabled: boolean;
  default_public: boolean;
  default_self_registration: boolean;
  save_attendance_date: boolean;
  attendance_date_person_field_id?: string;
  default_start_time?: string;
  default_duration_minutes?: number;
  custom_fields: EventCustomField[];
  color: string;
  icon: string;
}

export interface EventTypeFormDialogProps {
  open: boolean;
  mode: CreateEditDialogMode;
  eventType: EventType | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: EventTypeFormValues) => void;
}

export interface EventTypeDetailsDialogProps {
  open: boolean;
  eventType: EventType | null;
  editDisabled?: boolean;
  onClose: () => void;
  onEdit: () => void;
}
