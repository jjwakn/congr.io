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
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { evaluateCalculatedField } from '@utils/customFields';
import { calculateAgeFromBirthdate, calculateDisplayedRegisteredAge } from '@utils/datetime';
import { httpRequest } from '@utils/http';
import { getPreloadedResource } from '@utils/preload';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JsonObject } from '@/types/json.types';
import type { Person, PersonField } from '@/types/person.types';
import { PersonDetailsDialog } from './PersonDetailsDialog';
import { PersonFormDialog } from './PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from './persons.types';

type PersonColumnId =
  | 'id'
  | 'code'
  | 'name'
  | 'first_name'
  | 'middle_name'
  | 'last_name'
  | 'second_last_name'
  | 'married_name'
  | 'phone'
  | 'birthdate'
  | 'age'
  | 'email'
  | 'user_id'
  | 'actions'
  | CrudAuditColumnId
  | `custom:${string}`;

const PERSON_COLUMN_IDS: PersonColumnId[] = [
  'id',
  'code',
  'name',
  'first_name',
  'middle_name',
  'last_name',
  'second_last_name',
  'married_name',
  'phone',
  'birthdate',
  'age',
  'email',
  'user_id',
  'actions',
];
const DEFAULT_PERSON_VISIBLE_COLUMNS: PersonColumnId[] = ['code', 'name', 'phone', 'age', 'actions'];
const DEFAULT_PERSON_SEARCH_COLUMNS: PersonColumnId[] = [
  'code',
  'first_name',
  'middle_name',
  'last_name',
  'second_last_name',
  'phone',
  'email',
];

const personFullName = (row: Person) =>
  [row.first_name, row.middle_name, row.last_name, row.second_last_name].filter(Boolean).join(' ');

export const PersonsManagement = () => {
  const { i18n, t } = useTranslation();
  const { auth, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const cached = getPreloadedResource<{ result: Person[]; total: number }>('members');
  const [rows, setRows] = useState<Person[]>(cached?.result ?? []);
  const [fields, setFields] = useState<PersonField[]>([]);
  const [total, setTotal] = useState(cached?.total ?? 0);
  const [loading, setLoading] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>();
  const [personOpen, setPersonOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; kind: 'person' }>();
  const [submitting, setSubmitting] = useState(false);
  const [loadingPersonId, setLoadingPersonId] = useState<string | null>(null);
  const [detailPerson, setDetailPerson] = useState<Person>();
  const [createdCode, setCreatedCode] = useState('');
  const allColumnIds = useMemo<PersonColumnId[]>(
    () => [
      ...PERSON_COLUMN_IDS,
      ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : []),
      ...fields.map((field) => `custom:${field.id}` as PersonColumnId),
    ],
    [auth?.fullAccess, fields],
  );
  const columnVisibility = useModuleColumnVisibility<PersonColumnId>({
    moduleKey: 'members-list',
    allColumnIds,
    defaultVisibleColumnIds: DEFAULT_PERSON_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: DEFAULT_PERSON_SEARCH_COLUMNS,
  });
  const list = useModuleList({
    moduleKey: 'members-list',
    defaultSort: 'last_name',
  });
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpRequest<{ result: Person[]; total: number }>({
        service: PersonsService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          columns: columnVisibility.columnsQuery,
          search_columns: columnVisibility.searchColumnsQuery,
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
        },
      });
      setRows(response.result);
      setTotal(response.total);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.loadFailed'), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [
    columnVisibility.columnsQuery,
    columnVisibility.searchColumnsQuery,
    list.debouncedSearch,
    list.direction,
    list.page,
    list.pageSize,
    list.sort,
    showNotification,
    t,
  ]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!hasPermission('person_field', 'get')) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setFields(result));
  }, [hasPermission]);
  const loadPerson = useCallback(
    async (row: Person) => {
      setLoadingPersonId(row.id);
      try {
        return await httpRequest<Person>({ service: PersonsService.get, data: { id: row.id } });
      } catch (value) {
        showNotification(value instanceof Error ? value.message : t('pages.persons.loadFailed'), { severity: 'error' });
        return null;
      } finally {
        setLoadingPersonId(null);
      }
    },
    [showNotification, t],
  );

  const openEdit = useCallback(
    async (row: Person) => {
      const person = await loadPerson(row);
      if (!person) return;
      setEditPerson(person);
      setPersonOpen(true);
    },
    [loadPerson],
  );

  const openDetails = useCallback(
    async (row: Person) => {
      const person = await loadPerson(row);
      if (person) setDetailPerson(person);
    },
    [loadPerson],
  );

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<Person>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<
    Array<
      {
        id: PersonColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<Person>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id', minWidth: 260, render: (row: Person) => row.id },
      {
        id: 'code',
        label: t('pages.persons.fields.code'),
        sortKey: 'code',
        minWidth: 90,
        render: (row: Person) => row.code,
      },
      {
        id: 'name',
        label: t('form.field.name'),
        sortKey: 'last_name',
        minWidth: 180,
        render: personFullName,
      },
      {
        id: 'first_name',
        label: t('pages.persons.fields.firstName'),
        sortKey: 'first_name',
        minWidth: 140,
        render: (row: Person) => row.first_name,
      },
      {
        id: 'middle_name',
        label: t('pages.persons.fields.middleName'),
        sortKey: 'middle_name',
        minWidth: 140,
        render: (row: Person) => row.middle_name || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'last_name',
        label: t('pages.persons.fields.lastName'),
        sortKey: 'last_name',
        minWidth: 140,
        render: (row: Person) => row.last_name,
      },
      {
        id: 'second_last_name',
        label: t('pages.persons.fields.secondLastName'),
        sortKey: 'second_last_name',
        minWidth: 140,
        render: (row: Person) => row.second_last_name || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'married_name',
        label: t('pages.persons.fields.marriedName'),
        sortKey: 'married_name',
        minWidth: 140,
        render: (row: Person) => row.married_name || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'phone',
        label: t('pages.persons.fields.phone'),
        sortKey: 'phone',
        minWidth: 140,
        render: (row: Person) => row.phone || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'birthdate',
        label: t('pages.persons.fields.birthdate'),
        sortKey: 'birthdate',
        minWidth: 140,
        render: (row: Person) => row.birthdate || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'age',
        label: t('pages.persons.fields.age'),
        sortKey: 'registered_age',
        width: 80,
        render: (row: Person) =>
          row.birthdate
            ? (calculateAgeFromBirthdate(row.birthdate) ?? '-')
            : (calculateDisplayedRegisteredAge(row.registered_age, row.age_recorded_at) ?? '-'),
      },
      {
        id: 'email',
        label: t('pages.persons.fields.email'),
        sortKey: 'email',
        minWidth: 180,
        render: (row: Person) => row.email || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'user_id',
        label: t('pages.modules.users.columns.username'),
        minWidth: 160,
        render: (row: Person) => row.user?.username ?? row.user_id ?? t('pages.modules.common.emptyValue'),
      },
      ...auditColumnDefinitions,
      ...fields.map(
        (field): { id: PersonColumnId; label: string; minWidth: number; render: (row: Person) => string } => ({
          id: `custom:${field.id}`,
          label: field.label,
          minWidth: 160,
          render: (row) => {
            if (field.type === 'yes_no' && field.calculated_conditions.length) {
              const standardValues: JsonObject = {
                first_name: row.first_name,
                middle_name: row.middle_name ?? null,
                last_name: row.last_name,
                second_last_name: row.second_last_name ?? null,
                married_name: row.married_name ?? null,
                phone: row.phone,
                birthdate: row.birthdate ?? null,
                age: calculateDisplayedRegisteredAge(row.registered_age, row.age_recorded_at) ?? null,
                email: row.email ?? null,
              };
              return evaluateCalculatedField({
                field,
                standardValues,
                customValues: row.custom_values,
              })
                ? t('pages.modules.common.filterYes')
                : t('pages.modules.common.filterNo');
            }

            const value = row.custom_values[field.id];
            if (Array.isArray(value)) return value.map(String).join(', ');
            if (typeof value === 'boolean') {
              return value ? t('pages.modules.common.filterYes') : t('pages.modules.common.filterNo');
            }
            return value === null || value === undefined || value === ''
              ? t('pages.modules.common.emptyValue')
              : String(value);
          },
        }),
      ),
      {
        id: 'actions',
        label: t('pages.settings.congregation.actions'),
        minWidth: 140,
        align: 'right' as const,
        render: (row: Person) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'view',
                label: t('pages.modules.common.view'),
                icon: VisibilityOutlinedIcon,
                disabled: (value) => loadingPersonId === value.id,
                onClick: (value) => void openDetails(value),
              },
              {
                id: 'edit',
                label: t('pages.persons.edit'),
                icon: EditOutlinedIcon,
                hidden: !hasPermission('person', 'update'),
                disabled: (value) => loadingPersonId === value.id,
                onClick: (value) => void openEdit(value),
              },
              {
                id: 'delete',
                label: t('form.common.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !hasPermission('person', 'delete'),
                onClick: (value) => setPendingDelete({ id: value.id, kind: 'person' }),
              },
            ]}
          />
        ),
      },
    ],
    [auditColumnDefinitions, fields, hasPermission, loadingPersonId, openDetails, openEdit, t],
  );
  const visibleColumnDefinitions = useMemo(
    () =>
      columnDefinitions.filter(
        (column) => column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );
  const personColumns = useMemo<ModuleListColumn<Person>[]>(
    () =>
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        minWidth: column.minWidth,
        width: column.width,
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
  const savePerson = async (values: PersonFormValues) => {
    setSubmitting(true);
    try {
      const result = await httpRequest<Person>({
        service: editPerson ? PersonsService.update : PersonsService.create,
        data: { ...(editPerson ? { id: editPerson.id } : {}), ...values },
      });
      setPersonOpen(false);
      setEditPerson(null);
      await refresh();
      if (editPerson) showNotification(t('pages.persons.saved'), { severity: 'success' });
      else setCreatedCode(result.code);
    } finally {
      setSubmitting(false);
    }
  };
  const saveField = async (values: PersonFieldFormValues) => {
    setSubmitting(true);
    try {
      const created = await httpRequest<PersonField>({
        service: PersonFieldsService.create,
        data: values,
      });
      setFields((current) => [...current, created].sort((left, right) => left.label.localeCompare(right.label)));
      showNotification(t('pages.persons.fieldsCrud.created'), { severity: 'success' });
      return created;
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.fieldsCrud.saveFailed'), {
        severity: 'error',
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <ModuleSection<Person>
        createAction={
          hasPermission('person', 'create')
            ? {
                id: 'create',
                label: t('form.field.add'),
                onClick: () => setPersonOpen(true),
              }
            : undefined
        }
        refreshAction={{ id: 'refresh', label: t('pages.modules.common.refresh'), onClick: () => void refresh() }}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows,
          columns: personColumns,
          rows,
          getRowId: (row: { id: string }) => row.id,
          loading,
          loadingLabel: t('pages.persons.loading'),
          emptyLabel: t('pages.persons.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total,
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
            disabled: loading,
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as PersonColumnId[]),
          },
        }}
      />
      {personOpen ? (
        <PersonFormDialog
          open
          person={editPerson ?? null}
          fields={fields}
          canCreateFields={hasPermission('person_field', 'create')}
          submitting={submitting}
          onClose={() => {
            setPersonOpen(false);
            setEditPerson(null);
          }}
          onSubmit={(v) => void savePerson(v)}
          onCreateField={(v) => saveField(v)}
        />
      ) : null}
      {detailPerson ? (
        <PersonDetailsDialog
          person={detailPerson}
          fields={fields}
          editDisabled={!hasPermission('person', 'update')}
          onClose={() => setDetailPerson(undefined)}
          onEdit={
            hasPermission('person', 'update')
              ? () => {
                  setEditPerson(detailPerson);
                  setPersonOpen(true);
                  setDetailPerson(undefined);
                }
              : undefined
          }
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('form.common.delete')}
        message={t('pages.persons.deleteMessage')}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setPendingDelete(undefined)}
        onConfirm={() =>
          void (async () => {
            if (!pendingDelete) return;
            setSubmitting(true);
            try {
              await httpRequest({
                service: PersonsService.remove,
                data: { id: pendingDelete.id },
              });
              setPendingDelete(undefined);
              await refresh();
            } finally {
              setSubmitting(false);
            }
          })()
        }
      />
      <Dialog open={Boolean(createdCode)} onClose={() => setCreatedCode('')} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textAlign: 'center', typography: 'h3' }}>{createdCode}</DialogTitle>
        <DialogContent>
          <Typography align="center" color="text.secondary">
            {t('pages.persons.code.createdTitle')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => setCreatedCode('')}>
            {t('form.field.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PersonsManagement;
