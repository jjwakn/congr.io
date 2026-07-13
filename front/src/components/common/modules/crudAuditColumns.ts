import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import type { TFunction } from 'i18next';
import { DateTime } from 'luxon';
import type { CommonEntity } from '@/types/common.types';
import type { User } from '@/types/user.types';

export type CrudAuditColumnId = 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by' | 'deleted_by';

export const CRUD_AUDIT_COLUMN_IDS: CrudAuditColumnId[] = [
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
  'deleted_by',
];

const AUDIT_USER_COLUMN_IDS: CrudAuditColumnId[] = ['created_by', 'updated_by', 'deleted_by'];

const EMPTY_VALUE = '-';

const formatAuditDate = (value: CommonEntity[CrudAuditColumnId], language: string) => {
  if (!value) return EMPTY_VALUE;

  const date = DateTime.fromISO(String(value));
  return date.isValid ? date.setLocale(language).toLocaleString(DateTime.DATETIME_MED) : EMPTY_VALUE;
};

const getAuditUserName = (value: CommonEntity[CrudAuditColumnId]) => {
  const user = value as User | null | undefined;
  return user?.name || user?.username || EMPTY_VALUE;
};

export type CrudAuditColumnDefinition<RowType extends CommonEntity> = {
  id: CrudAuditColumnId;
  label: string;
  sortKey?: string;
} & ModuleListColumn<RowType>;

export const getCrudAuditColumnDefinitions = <RowType extends CommonEntity>({
  language,
  t,
}: {
  language: string;
  t: TFunction;
}): {
  columns: CrudAuditColumnDefinition<RowType>[];
  headers: ModuleListHeaderCell[];
} => {
  const columns = CRUD_AUDIT_COLUMN_IDS.map<CrudAuditColumnDefinition<RowType>>((id) => ({
    id,
    label: t(`pages.modules.common.audit.${id}`),
    sortKey: AUDIT_USER_COLUMN_IDS.includes(id) ? undefined : id,
    minWidth: AUDIT_USER_COLUMN_IDS.includes(id) ? 160 : 190,
    render: (row) =>
      AUDIT_USER_COLUMN_IDS.includes(id) ? getAuditUserName(row[id]) : formatAuditDate(row[id], language),
  }));

  return {
    columns,
    headers: columns.map(({ id, label, sortKey, align }) => ({ id, label, sortKey, align })),
  };
};
