import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import {
  CRUD_AUDIT_COLUMN_IDS,
  type CrudAuditColumnId,
  getCrudAuditColumnDefinitions,
} from '@components/common/modules/crudAuditColumns';
import { useModuleColumnVisibility } from '@components/common/modules/useModuleColumnVisibility';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert } from '@mui/material';
import { PersonFieldsService } from '@services/persons';
import { STANDARD_PERSON_FIELDS } from '@utils/customFields';
import { httpRequest } from '@utils/http';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldCondition, FieldConditionOperator, PersonField } from '@/types/person.types';
import { PersonFieldSettingsFormDialog } from './PersonFieldSettingsFormDialog';
import type { PersonFieldFormValues } from './personFields.types';
import { usePersonFieldsList } from './usePersonFieldsList';

type PersonFieldRow = PersonField & { persistent?: boolean };
type PersonFieldColumnId =
  | 'id'
  | 'label'
  | 'type'
  | 'options'
  | 'conditions'
  | 'required'
  | 'allow_multiple'
  | 'actions'
  | CrudAuditColumnId;

const VALUELESS_OPERATORS: FieldConditionOperator[] = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];
const PERSON_FIELD_COLUMN_IDS: PersonFieldColumnId[] = [
  'id',
  'label',
  'type',
  'options',
  'conditions',
  'required',
  'allow_multiple',
  'actions',
];
const DEFAULT_PERSON_FIELD_VISIBLE_COLUMNS: PersonFieldColumnId[] = [
  'label',
  'type',
  'options',
  'conditions',
  'actions',
];

const formatConditionValue = (value: FieldCondition['value']) =>
  value === null || value === undefined || value === '' ? '' : String(value);

export const PersonFieldsManagement = () => {
  const { i18n, t } = useTranslation();
  const { auth, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('person_field', 'get');
  const canCreate = hasPermission('person_field', 'create');
  const canUpdate = hasPermission('person_field', 'update');
  const canDelete = hasPermission('person_field', 'delete');
  const allColumnIds = useMemo<PersonFieldColumnId[]>(
    () => [...PERSON_FIELD_COLUMN_IDS, ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : [])],
    [auth?.fullAccess],
  );
  const columnVisibility = useModuleColumnVisibility<PersonFieldColumnId>({
    moduleKey: 'settings-person-fields-list',
    allColumnIds,
    defaultVisibleColumnIds: DEFAULT_PERSON_FIELD_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: ['label'],
  });
  const list = usePersonFieldsList({
    enabled: canView,
    columnsQuery: columnVisibility.columnsQuery,
    searchColumnsQuery: columnVisibility.searchColumnsQuery,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PersonField | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PersonField | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rows = useMemo<PersonFieldRow[]>(
    () => [
      ...STANDARD_PERSON_FIELDS.map(
        (field) =>
          ({
            id: field.id,
            label: t(field.labelKey),
            type: field.type,
            options: field.options,
            required: false,
            allow_multiple: field.allow_multiple ?? false,
            calculated_conditions: [],
            enabled: true,
            congregation_id: '',
            persistent: true,
          }) as PersonFieldRow,
      ),
      ...list.result,
    ],
    [list.result, t],
  );
  const conditionFieldLabels = useMemo(
    () =>
      new Map([
        ...STANDARD_PERSON_FIELDS.map((field) => [field.id, t(field.labelKey)] as const),
        ...list.result.map((field) => [field.id, field.label] as const),
      ]),
    [list.result, t],
  );
  const operatorLabels = useMemo<Record<FieldConditionOperator, string>>(
    () => ({
      equals: t('pages.persons.fieldsCrud.operators.equals'),
      not_equals: t('pages.persons.fieldsCrud.operators.notEquals'),
      contains: t('pages.persons.fieldsCrud.operators.contains'),
      starts_with: t('pages.persons.fieldsCrud.operators.startsWith'),
      ends_with: t('pages.persons.fieldsCrud.operators.endsWith'),
      greater_than: t('pages.persons.fieldsCrud.operators.greaterThan'),
      greater_or_equal: t('pages.persons.fieldsCrud.operators.greaterOrEqual'),
      less_than: t('pages.persons.fieldsCrud.operators.lessThan'),
      less_or_equal: t('pages.persons.fieldsCrud.operators.lessOrEqual'),
      is_empty: t('pages.persons.fieldsCrud.operators.empty'),
      is_not_empty: t('pages.persons.fieldsCrud.operators.notEmpty'),
      is_true: t('pages.persons.fieldsCrud.operators.isTrue'),
      is_false: t('pages.persons.fieldsCrud.operators.isFalse'),
    }),
    [t],
  );

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<PersonFieldRow>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<
    Array<
      {
        id: PersonFieldColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<PersonFieldRow>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id', minWidth: 260, render: (row) => row.id },
      {
        id: 'label',
        label: t('pages.persons.fieldsCrud.label'),
        sortKey: 'label',
        minWidth: 180,
        render: (row) => row.label,
      },
      {
        id: 'type',
        label: t('pages.persons.fieldsCrud.type'),
        sortKey: 'type',
        minWidth: 120,
        render: (row) => t(`pages.persons.fieldTypes.${row.type}`),
      },
      {
        id: 'options',
        label: t('pages.persons.fieldsCrud.options'),
        minWidth: 180,
        render: (row) => (row.options?.length ? row.options.join(', ') : t('pages.modules.common.emptyValue')),
      },
      {
        id: 'conditions',
        label: t('pages.persons.fieldsCrud.conditions'),
        minWidth: 260,
        render: (row) =>
          row.type === 'yes_no' && row.calculated_conditions?.length
            ? row.calculated_conditions
                .map((condition) => {
                  const fieldLabel = conditionFieldLabels.get(condition.field_id) ?? condition.field_id;
                  const operatorLabel = operatorLabels[condition.operator];
                  const valueLabel = VALUELESS_OPERATORS.includes(condition.operator)
                    ? ''
                    : formatConditionValue(condition.value);

                  return [fieldLabel, operatorLabel, valueLabel].filter(Boolean).join(' ');
                })
                .join('; ')
            : t('pages.modules.common.emptyValue'),
      },
      {
        id: 'required',
        label: t('pages.persons.fieldsCrud.required'),
        sortKey: 'required',
        minWidth: 120,
        render: (row) => (row.required ? t('pages.modules.common.filterYes') : t('pages.modules.common.filterNo')),
      },
      {
        id: 'allow_multiple',
        label: t('pages.persons.fieldsCrud.allowMultiple'),
        sortKey: 'allow_multiple',
        minWidth: 150,
        render: (row) =>
          row.allow_multiple ? t('pages.modules.common.filterYes') : t('pages.modules.common.filterNo'),
      },
      ...auditColumnDefinitions,
      {
        id: 'actions',
        label: t('pages.settings.congregation.actions'),
        width: 100,
        align: 'right',
        render: (row) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'edit',
                label: t('pages.persons.edit'),
                icon: EditOutlinedIcon,
                hidden: !canUpdate || row.persistent,
                onClick: (value) => {
                  setSelected(value);
                  setFormOpen(true);
                },
              },
              {
                id: 'delete',
                label: t('form.common.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete || row.persistent,
                onClick: setPendingDelete,
              },
            ]}
          />
        ),
      },
    ],
    [auditColumnDefinitions, canDelete, canUpdate, conditionFieldLabels, operatorLabels, t],
  );
  const visibleColumnDefinitions = useMemo(
    () =>
      columnDefinitions.filter(
        (column) => column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );
  const columns = useMemo<ModuleListColumn<PersonFieldRow>[]>(
    () =>
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        width: column.width,
        minWidth: column.minWidth,
        align: column.align,
        render: column.render,
      })),
    [visibleColumnDefinitions],
  );
  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        label: column.label,
        sortKey: column.sortKey,
        align: column.align,
      })),
    ],
    [visibleColumnDefinitions],
  );

  const save = async (values: PersonFieldFormValues) => {
    setSubmitting(true);
    try {
      await httpRequest<PersonField>({
        service: selected ? PersonFieldsService.update : PersonFieldsService.create,
        data: { ...(selected ? { id: selected.id } : {}), ...values },
      });
      setFormOpen(false);
      setSelected(null);
      await list.refresh();
      showNotification(t('pages.persons.fieldsCrud.saved'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.fieldsCrud.saveFailed'), {
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setSubmitting(true);
    try {
      await httpRequest({ service: PersonFieldsService.remove, data: { id: pendingDelete.id } });
      setPendingDelete(null);
      await list.refresh();
      showNotification(t('pages.persons.fieldsCrud.deleted'), { severity: 'success' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModuleSection<PersonFieldRow>
        title={t('pages.persons.fieldsTitle')}
        createAction={
          canCreate
            ? {
                id: 'create-person-field',
                label: t('pages.persons.fieldsCrud.create'),
                onClick: () => {
                  setSelected(null);
                  setFormOpen(true);
                },
              }
            : undefined
        }
        refreshAction={{
          id: 'refresh-person-fields',
          label: t('pages.modules.common.refresh'),
          onClick: () => void list.refresh(),
        }}
        alerts={list.error ? <Alert severity="error">{list.error}</Alert> : undefined}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows,
          columns,
          rows,
          getRowId: (row) => row.id,
          loading: list.loading,
          loadingLabel: t('pages.persons.loading'),
          emptyLabel: t('pages.persons.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total: list.total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          columnVisibility: {
            label: t('pages.modules.common.columns'),
            options: columnDefinitions
              .filter((column) => column.id !== 'actions')
              .map((column) => ({ id: column.id, label: column.label })),
            visibleIds: columnVisibility.visibleColumnIds,
            defaultVisibleIds: columnVisibility.defaultVisibleColumnIds,
            disabled: list.loading,
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as PersonFieldColumnId[]),
          },
          fixedEndColumnIds: ['actions'],
        }}
      />

      <PersonFieldSettingsFormDialog
        open={formOpen}
        mode={selected ? 'edit' : 'create'}
        field={selected}
        fields={list.result}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void save(values)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('form.common.delete')}
        message={t('pages.persons.deleteFieldMessage', { name: pendingDelete?.label ?? '' })}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
};
