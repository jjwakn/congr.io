import type { CreateEditDialogMode } from '@components/common/forms/CreateEditDialog.types';
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import type { FieldCondition, PersonField, PersonFieldType } from '@/types/person.types';

export interface PersonFieldsListResponse {
  result: PersonField[];
  total: number;
}

export interface PersonFieldFormValues {
  [key: string]: string | boolean | string[] | FieldCondition[];
  label: string;
  type: PersonFieldType;
  required: boolean;
  allow_multiple: boolean;
  options: string[];
  calculated_conditions: FieldCondition[];
}

export interface UsePersonFieldsListResult extends PersonFieldsListResponse {
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

export interface PersonFieldFormDialogProps {
  open: boolean;
  mode: CreateEditDialogMode;
  field: PersonField | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: PersonFieldFormValues) => void;
}
