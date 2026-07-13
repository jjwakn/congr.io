import { PersonAutocomplete } from '@components/common/PersonAutocomplete';
import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
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
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Alert, Box, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ServiceNewPeopleService, ServicesService } from '@services/services';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/hooks/useNotifications';
import type { Person } from '@/types/person.types';
import type {
  Service,
  ServiceListResponse,
  ServiceNewPeople,
  ServiceNewPeopleListResponse,
} from '@/types/service.types';

interface NewPeopleFormState {
  service_id: string;
  date: string;
  notes: string;
  enabled: boolean;
}

type ServiceNewPeopleColumnId = 'id' | 'date' | 'service' | 'notes' | 'actions' | CrudAuditColumnId;
const SERVICE_NEW_PEOPLE_COLUMN_IDS: ServiceNewPeopleColumnId[] = ['id', 'date', 'service', 'notes', 'actions'];
const DEFAULT_SERVICE_NEW_PEOPLE_VISIBLE_COLUMNS: ServiceNewPeopleColumnId[] = ['date', 'service', 'notes', 'actions'];

const createForm = (serviceId = ''): NewPeopleFormState => ({
  service_id: serviceId,
  date: DateTime.local().toISODate() ?? '',
  notes: '',
  enabled: true,
});

const toForm = (group: ServiceNewPeople): NewPeopleFormState => ({
  service_id: group.service_id,
  date: group.date,
  notes: group.notes,
  enabled: group.enabled,
});

const getPersonName = (person?: Person) => (person ? `${person.code} · ${person.first_name} ${person.last_name}` : '');

const ServiceNewPeopleManagement = () => {
  const { i18n, t } = useTranslation();
  const { auth, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const list = useModuleList({ moduleKey: 'services-new-people-list', defaultSort: 'date', defaultDirection: 'DESC' });
  const allColumnIds = useMemo<ServiceNewPeopleColumnId[]>(
    () => [...SERVICE_NEW_PEOPLE_COLUMN_IDS, ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : [])],
    [auth?.fullAccess],
  );
  const columnVisibility = useModuleColumnVisibility<ServiceNewPeopleColumnId>({
    moduleKey: 'services-new-people-list',
    allColumnIds,
    defaultVisibleColumnIds: DEFAULT_SERVICE_NEW_PEOPLE_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: ['date', 'notes'],
  });
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [services, setServices] = useState<Service[]>([]);
  const [rows, setRows] = useState<ServiceNewPeople[]>([]);
  const [selected, setSelected] = useState<ServiceNewPeople | null>(null);
  const [editing, setEditing] = useState<ServiceNewPeople | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<ServiceNewPeople | null>(null);
  const [form, setForm] = useState<NewPeopleFormState>(() => createForm());
  const [person, setPerson] = useState<Person | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canCreate = hasPermission('service_new_people', 'create');
  const canUpdate = hasPermission('service_new_people', 'update');
  const canDelete = hasPermission('service_new_people', 'delete');

  const loadServices = useCallback(async () => {
    const response = await httpRequest<ServiceListResponse>({
      service: ServicesService.list,
      data: { page: 0, size: 200, order: 'day_of_week', direction: 'ASC' },
    });
    setServices(response.result);
    setForm((current) => (current.service_id ? current : { ...current, service_id: response.result[0]?.id ?? '' }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await httpRequest<ServiceNewPeopleListResponse>({
        service: ServiceNewPeopleService.list,
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
      setError(value instanceof Error ? value.message : t('pages.services.newPeople.empty'));
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
    t,
  ]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetails = async (group: ServiceNewPeople) => {
    const details = await httpRequest<ServiceNewPeople>({
      service: ServiceNewPeopleService.get,
      data: { id: group.id },
    });
    setSelected(details);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(createForm(services[0]?.id ?? ''));
    setGroupDialogOpen(true);
  };

  const openEdit = (group: ServiceNewPeople) => {
    setEditing(group);
    setForm(toForm(group));
    setGroupDialogOpen(true);
  };

  const save = async () => {
    setSubmitting(true);
    try {
      const saved = await httpRequest<ServiceNewPeople>({
        service: editing ? ServiceNewPeopleService.update : ServiceNewPeopleService.create,
        data: { ...(editing ? { id: editing.id } : {}), ...form },
      });
      setGroupDialogOpen(false);
      setEditing(null);
      showNotification(t('pages.services.newPeople.saved'), { severity: 'success' });
      await load();
      await loadDetails(saved);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.services.saveFailed'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await httpRequest({ service: ServiceNewPeopleService.remove, data: { id: deleting.id } });
      setDeleting(null);
      showNotification(t('pages.services.newPeople.deleted'), { severity: 'success' });
      await load();
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.services.saveFailed'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const addPerson = async () => {
    if (!selected || !person) return;
    setSubmitting(true);
    try {
      const updated = await httpRequest<ServiceNewPeople>({
        service: ServiceNewPeopleService.addPerson,
        data: { id: selected.id, person_id: person.id },
      });
      setSelected(updated);
      setPerson(null);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.services.saveFailed'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const visibleRows = useMemo(() => {
    if (tab === 'history') return rows;
    const today = DateTime.local().toISODate();
    return rows.filter(({ date }) => date === today);
  }, [rows, tab]);

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<ServiceNewPeople>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<
    Array<
      {
        id: ServiceNewPeopleColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<ServiceNewPeople>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id', minWidth: 260, render: (row) => row.id },
      { id: 'date', label: t('pages.services.newPeople.date'), sortKey: 'date', render: (row) => row.date },
      {
        id: 'service',
        label: t('pages.services.newPeople.service'),
        sortKey: 'service_id',
        render: (row) => services.find(({ id }) => id === row.service_id)?.name ?? row.service?.name ?? '-',
      },
      {
        id: 'notes',
        label: t('pages.services.newPeople.notes'),
        sortKey: 'notes',
        render: (row) => row.notes || '-',
      },
      ...auditColumnDefinitions,
      {
        id: 'actions',
        label: t('pages.modules.common.actions'),
        align: 'right',
        render: (row) => (
          <ModuleRowActions
            row={row}
            actions={[
              { id: 'view', label: t('pages.modules.common.view'), icon: VisibilityRoundedIcon, onClick: loadDetails },
              {
                id: 'edit',
                label: t('pages.services.newPeople.edit'),
                icon: EditRoundedIcon,
                color: 'secondary',
                disabled: !canUpdate,
                onClick: openEdit,
              },
              {
                id: 'delete',
                label: t('form.common.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                disabled: !canDelete,
                onClick: setDeleting,
              },
            ]}
          />
        ),
      },
    ],
    [auditColumnDefinitions, canDelete, canUpdate, services, t],
  );
  const visibleColumnDefinitions = useMemo(
    () =>
      columnDefinitions.filter(
        (column) => column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );
  const columns = useMemo<ModuleListColumn<ServiceNewPeople>[]>(
    () =>
      visibleColumnDefinitions.map((column) => ({
        id: column.id,
        align: column.align,
        minWidth: column.minWidth,
        width: column.width,
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

  return (
    <Stack spacing={2} sx={{ minHeight: 0, flex: 1 }}>
      <Tabs value={tab} onChange={(_event, value: 'today' | 'history') => setTab(value)}>
        <Tab value="today" label={t('pages.services.newPeople.today')} />
        <Tab value="history" label={t('pages.services.newPeople.history')} />
      </Tabs>
      <ModuleSection<ServiceNewPeople>
        title=""
        alerts={error ? <Alert severity="error">{error}</Alert> : null}
        search={{
          label: t('pages.modules.common.search'),
          value: list.search,
          onChange: list.setSearch,
        }}
        createAction={
          canCreate ? { id: 'new-group', label: t('pages.services.newPeople.create'), onClick: openCreate } : undefined
        }
        refreshAction={{
          id: 'refresh-new-people',
          label: t('pages.modules.common.refresh'),
          onClick: () => void load(),
        }}
        table={{
          headerRows,
          columns,
          rows: visibleRows,
          getRowId: (row) => row.id,
          loading,
          loadingLabel: t('pages.services.newPeople.loading'),
          emptyLabel: tab === 'today' ? t('pages.services.newPeople.noCurrent') : t('pages.services.newPeople.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total: tab === 'today' ? visibleRows.length : total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          columnVisibility: {
            label: t('pages.modules.common.columns'),
            options: columnDefinitions
              .filter((column) => column.id !== 'actions')
              .map((column) => ({ id: column.id, label: column.label })),
            visibleIds: columnVisibility.visibleColumnIds,
            disabled: loading,
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as ServiceNewPeopleColumnId[]),
          },
        }}
      />

      <CreateEditDialog
        open={groupDialogOpen}
        mode={editing ? 'edit' : 'create'}
        submitting={submitting}
        submitDisabled={!form.service_id || !form.date}
        onClose={() => {
          setGroupDialogOpen(false);
          setEditing(null);
        }}
        onSubmit={save}
        labels={{
          createTitle: t('pages.services.newPeople.create'),
          editTitle: t('pages.services.newPeople.edit'),
          createSubmit: t('pages.services.newPeople.create'),
          editSubmit: t('pages.settings.actions.save'),
          cancel: t('form.field.cancel'),
        }}
      >
        <TextField
          select
          required
          label={t('pages.services.newPeople.service')}
          value={form.service_id}
          onChange={(event) => setForm((current) => ({ ...current, service_id: event.target.value }))}
        >
          {services.map((service) => (
            <MenuItem key={service.id} value={service.id}>
              {service.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          label={t('pages.services.newPeople.date')}
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          multiline
          minRows={3}
          label={t('pages.services.newPeople.notes')}
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        />
      </CreateEditDialog>

      <CreateEditDialog
        open={Boolean(selected)}
        mode="edit"
        submitting={submitting}
        submitDisabled={!person}
        onClose={() => setSelected(null)}
        onSubmit={addPerson}
        labels={{
          createTitle: t('pages.services.newPeople.people'),
          editTitle: t('pages.services.newPeople.people'),
          createSubmit: t('pages.services.newPeople.addPerson'),
          editSubmit: t('pages.services.newPeople.addPerson'),
          cancel: t('form.field.close'),
        }}
      >
        <Stack spacing={1}>
          {(selected?.people ?? []).map((entry) => (
            <Typography key={entry.id}>{getPersonName(entry.person)}</Typography>
          ))}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <PersonAutocomplete
            value={person}
            label={t('pages.services.newPeople.addPerson')}
            onChange={setPerson}
            disabled={!canUpdate && !canCreate}
          />
        </Box>
      </CreateEditDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('pages.services.newPeople.deleteTitle')}
        message={t('pages.services.newPeople.deleteMessage')}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </Stack>
  );
};

export default ServiceNewPeopleManagement;
