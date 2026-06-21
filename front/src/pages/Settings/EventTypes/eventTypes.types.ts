import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { EventType } from '@/types/event-type.types';

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
  [key: string]: string | boolean;
  name: string;
  description: string;
  enabled: boolean;
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
