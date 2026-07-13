import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import type { ModuleListColumn, ModuleListHeaderCell } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Alert, Box, Button, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { ServicesService } from '@services/services';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/hooks/useNotifications';
import type { Service, ServiceAttendanceGroup, ServiceListResponse } from '@/types/service.types';

interface ServiceFormState {
  name: string;
  description: string;
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  attendance_groups: ServiceAttendanceGroup[];
  enabled: boolean;
}

const createEmptyForm = ({
  locationId = '',
  adultLabel,
  kidsLabel,
}: {
  locationId?: string;
  adultLabel: string;
  kidsLabel: string;
}): ServiceFormState => ({
  name: '',
  description: '',
  location_id: locationId,
  day_of_week: 0,
  start_time: '09:00',
  end_time: '10:30',
  attendance_groups: [
    { id: crypto.randomUUID(), label: adultLabel, color: '#1976d2' },
    { id: crypto.randomUUID(), label: kidsLabel, color: '#2e7d32' },
  ],
  enabled: true,
});

const toForm = (service: Service, defaultGroups: ServiceAttendanceGroup[]): ServiceFormState => ({
  name: service.name,
  description: service.description,
  location_id: service.location_id,
  day_of_week: service.day_of_week,
  start_time: service.start_time.slice(0, 5),
  end_time: service.end_time.slice(0, 5),
  attendance_groups: service.attendance_groups.length ? service.attendance_groups : defaultGroups,
  enabled: service.enabled,
});

const ServicesManagement = () => {
  const { t } = useTranslation();
  const { congregation } = useAppContext();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const list = useModuleList({ moduleKey: 'services-list', defaultSort: 'day_of_week' });
  const [rows, setRows] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [viewing, setViewing] = useState<Service | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [toggling, setToggling] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const defaultAttendanceGroups = useMemo(
    () =>
      createEmptyForm({
        adultLabel: t('pages.services.fields.defaultAdults'),
        kidsLabel: t('pages.services.fields.defaultKids'),
      }).attendance_groups,
    [t],
  );
  const [form, setForm] = useState<ServiceFormState>(() =>
    createEmptyForm({
      locationId: congregation?.locations?.[0]?.id ?? '',
      adultLabel: t('pages.services.fields.defaultAdults'),
      kidsLabel: t('pages.services.fields.defaultKids'),
    }),
  );
  const canCreate = hasPermission('service', 'create');
  const canUpdate = hasPermission('service', 'update');
  const canDelete = hasPermission('service', 'delete');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await httpRequest<ServiceListResponse>({
        service: ServicesService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
        },
      });
      setRows(response.result);
      setTotal(response.total);
    } catch (value) {
      setError(value instanceof Error ? value.message : t('pages.services.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(
      createEmptyForm({
        locationId: congregation?.locations?.[0]?.id ?? '',
        adultLabel: t('pages.services.fields.defaultAdults'),
        kidsLabel: t('pages.services.fields.defaultKids'),
      }),
    );
    setDialogMode('create');
  };

  const openEdit = useCallback(
    (service: Service) => {
      setViewing(null);
      setEditing(service);
      setForm(toForm(service, defaultAttendanceGroups));
      setDialogMode('edit');
    },
    [defaultAttendanceGroups],
  );

  const closeDialog = () => {
    if (submitting) return;
    setDialogMode(null);
    setEditing(null);
  };

  const save = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...(editing ? { id: editing.id } : {}),
        ...form,
        attendance_groups: form.attendance_groups.filter((group) => group.label.trim()),
      };
      await httpRequest<Service>({
        service: editing ? ServicesService.update : ServicesService.create,
        data,
      });
      showNotification(t('pages.services.saved'), { severity: 'success' });
      closeDialog();
      await load();
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
      await httpRequest({ service: ServicesService.remove, data: { id: deleting.id } });
      showNotification(t('pages.services.deleted'), { severity: 'success' });
      setDeleting(null);
      await load();
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.services.saveFailed'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async () => {
    if (!toggling) return;
    setSubmitting(true);
    try {
      await httpRequest<Service>({
        service: ServicesService.update,
        data: {
          id: toggling.id,
          ...toForm(toggling, defaultAttendanceGroups),
          enabled: !toggling.enabled,
        },
      });
      setToggling(null);
      await load();
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.services.saveFailed'), { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ModuleListColumn<Service>[]>(
    () => [
      { id: 'name', render: (row) => row.name },
      {
        id: 'location',
        render: (row) =>
          row.location?.name ?? congregation?.locations.find(({ id }) => id === row.location_id)?.name ?? '-',
      },
      { id: 'day_of_week', render: (row) => t(`pages.services.days.${row.day_of_week}`) },
      { id: 'start_time', render: (row) => row.start_time.slice(0, 5) },
      { id: 'end_time', render: (row) => row.end_time.slice(0, 5) },
      {
        id: 'enabled',
        align: 'center',
        render: (row) => (
          <Tooltip title={t('pages.services.fields.active')}>
            <span>
              <IconButton size="small" disabled={!canUpdate || loading} onClick={() => setToggling(row)}>
                {row.enabled ? (
                  <CheckCircleOutlineRoundedIcon color="success" />
                ) : (
                  <RemoveCircleOutlineRoundedIcon color="disabled" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
      {
        id: 'actions',
        align: 'right',
        render: (row) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'view',
                label: t('pages.services.view'),
                icon: VisibilityRoundedIcon,
                onClick: setViewing,
              },
              {
                id: 'edit',
                label: t('pages.services.edit'),
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
    [canDelete, canUpdate, congregation?.locations, loading, openEdit, t],
  );

  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      [
        { id: 'name', label: t('pages.services.fields.name'), sortKey: 'name' },
        { id: 'location', label: t('pages.services.fields.location') },
        { id: 'day_of_week', label: t('pages.services.fields.dayOfWeek'), sortKey: 'day_of_week' },
        { id: 'start_time', label: t('pages.services.fields.startTime'), sortKey: 'start_time' },
        { id: 'end_time', label: t('pages.services.fields.endTime'), sortKey: 'end_time' },
        { id: 'enabled', label: t('pages.services.fields.active'), align: 'center', sortKey: 'enabled' },
        { id: 'actions', label: t('pages.modules.common.actions'), align: 'right' },
      ],
    ],
    [t],
  );

  const formValid = Boolean(form.name.trim() && form.location_id && form.start_time && form.end_time);

  return (
    <>
      <ModuleSection<Service>
        title=""
        alerts={error ? <Alert severity="error">{error}</Alert> : null}
        search={{
          label: t('pages.modules.common.search'),
          value: list.search,
          onChange: list.setSearch,
        }}
        createAction={
          canCreate ? { id: 'create-service', label: t('pages.services.create'), onClick: openCreate } : undefined
        }
        refreshAction={{ id: 'refresh-services', label: t('pages.modules.common.refresh'), onClick: () => void load() }}
        table={{
          headerRows,
          columns,
          rows,
          getRowId: (row) => row.id,
          loading,
          loadingLabel: t('pages.services.loading'),
          emptyLabel: t('pages.services.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
        }}
      />

      <CreateEditDialog
        open={Boolean(dialogMode)}
        mode={dialogMode ?? 'create'}
        submitting={submitting}
        submitDisabled={!formValid}
        onClose={closeDialog}
        onSubmit={save}
        labels={{
          createTitle: t('pages.services.create'),
          editTitle: t('pages.services.edit'),
          createSubmit: t('pages.services.create'),
          editSubmit: t('pages.settings.actions.save'),
          cancel: t('form.field.cancel'),
        }}
      >
        <TextField
          required
          label={t('pages.services.fields.name')}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <TextField
          select
          required
          label={t('pages.services.fields.location')}
          value={form.location_id}
          onChange={(event) => setForm((current) => ({ ...current, location_id: event.target.value }))}
        >
          {(congregation?.locations ?? []).map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t('pages.services.fields.dayOfWeek')}
          value={form.day_of_week}
          onChange={(event) => setForm((current) => ({ ...current, day_of_week: Number(event.target.value) }))}
        >
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <MenuItem key={day} value={day}>
              {t(`pages.services.days.${day}`)}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            type="time"
            label={t('pages.services.fields.startTime')}
            value={form.start_time}
            onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))}
          />
          <TextField
            fullWidth
            type="time"
            label={t('pages.services.fields.endTime')}
            value={form.end_time}
            onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))}
          />
        </Stack>
        <TextField
          multiline
          minRows={3}
          label={t('pages.services.fields.description')}
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />
        <Stack spacing={1}>
          <Typography variant="subtitle2">{t('pages.services.fields.attendanceGroups')}</Typography>
          {form.attendance_groups.map((group, index) => (
            <Stack key={group.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                label={t('pages.services.fields.groupLabel')}
                value={group.label}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attendance_groups: current.attendance_groups.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, label: event.target.value } : item,
                    ),
                  }))
                }
              />
              <TextField
                type="color"
                label={t('pages.services.fields.groupColor')}
                value={group.color}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    attendance_groups: current.attendance_groups.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, color: event.target.value } : item,
                    ),
                  }))
                }
                sx={{ width: { xs: '100%', sm: 140 } }}
              />
              <Button
                color="error"
                disabled={form.attendance_groups.length <= 1}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    attendance_groups: current.attendance_groups.filter((item) => item.id !== group.id),
                  }))
                }
              >
                {t('form.common.delete')}
              </Button>
            </Stack>
          ))}
          <Button
            sx={{ alignSelf: 'flex-start' }}
            onClick={() =>
              setForm((current) => ({
                ...current,
                attendance_groups: [
                  ...current.attendance_groups,
                  { id: crypto.randomUUID(), label: '', color: '#1976d2' },
                ],
              }))
            }
          >
            {t('pages.services.fields.addGroup')}
          </Button>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={form.enabled}
            onChange={(_event, checked) => setForm((current) => ({ ...current, enabled: checked }))}
          />
          <Typography>{t('pages.services.fields.active')}</Typography>
        </Stack>
      </CreateEditDialog>

      <CreateEditDialog
        open={Boolean(viewing)}
        mode="edit"
        submitting={false}
        submitDisabled={!canUpdate}
        onClose={() => setViewing(null)}
        onSubmit={() => viewing && openEdit(viewing)}
        labels={{
          createTitle: t('pages.services.view'),
          editTitle: t('pages.services.view'),
          createSubmit: t('pages.services.edit'),
          editSubmit: t('pages.services.edit'),
          cancel: t('form.field.close'),
        }}
      >
        {viewing ? (
          <Box sx={{ cursor: 'not-allowed', '& .MuiInputBase-root': { cursor: 'not-allowed' } }}>
            <TextField label={t('pages.services.fields.name')} value={viewing.name} disabled fullWidth />
            <TextField
              label={t('pages.services.fields.location')}
              value={
                viewing.location?.name ??
                congregation?.locations.find(({ id }) => id === viewing.location_id)?.name ??
                ''
              }
              disabled
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              label={t('pages.services.fields.dayOfWeek')}
              value={t(`pages.services.days.${viewing.day_of_week}`)}
              disabled
              fullWidth
              sx={{ mt: 2 }}
            />
            <TextField
              label={t('pages.services.fields.description')}
              value={viewing.description}
              disabled
              multiline
              minRows={3}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        ) : null}
      </CreateEditDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('pages.services.deleteTitle')}
        message={t('pages.services.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor="error"
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={t('pages.services.fields.active')}
        message={toggling?.enabled ? t('pages.modules.common.disableConfirm') : t('pages.modules.common.enableConfirm')}
        confirmLabel={t('pages.settings.actions.save')}
        cancelLabel={t('form.field.cancel')}
        confirming={submitting}
        confirmColor={toggling?.enabled ? 'warning' : 'success'}
        onClose={() => setToggling(null)}
        onConfirm={toggleEnabled}
      />
    </>
  );
};

export default ServicesManagement;
