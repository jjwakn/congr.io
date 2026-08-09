import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, Typography } from '@mui/material';
import { EventTypesService } from '@services/eventTypes';
import { resolveEventFieldPersonLinks } from '@utils/eventFieldLinks';
import { HttpRequestError, httpRequest } from '@utils/http';
import { MuiIcon } from '@utils/muiIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { EventType } from '@/types/event-type.types';
import type { SettingsNavigationState } from '../settings.types';
import { EventTypeDetailsDialog } from './EventTypeDetailsDialog';
import { EventTypeFormDialog } from './EventTypeFormDialog';
import type { EventTypeFormValues } from './eventTypes.types';
import { useEventTypesList } from './useEventTypesList';

type EventTypeColumnId =
  | 'id'
  | 'icon'
  | 'name'
  | 'default_public'
  | 'default_self_registration'
  | 'attendance_enabled'
  | 'default_start_time'
  | 'default_duration_minutes'
  | 'description'
  | 'enabled'
  | 'actions'
  | CrudAuditColumnId;

const EVENT_TYPE_COLUMN_IDS: EventTypeColumnId[] = [
  'id',
  'icon',
  'name',
  'default_public',
  'default_self_registration',
  'attendance_enabled',
  'default_start_time',
  'default_duration_minutes',
  'description',
  'enabled',
  'actions',
];
const DEFAULT_EVENT_TYPE_VISIBLE_COLUMNS: EventTypeColumnId[] = [
  'icon',
  'name',
  'default_public',
  'default_self_registration',
  'attendance_enabled',
  'default_start_time',
  'default_duration_minutes',
  'enabled',
  'actions',
];

const getErrorMessage = (value: Error | null, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

export const EventTypesManagement = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('event_type', 'get');
  const canCreate = hasPermission('event_type', 'create');
  const canUpdate = hasPermission('event_type', 'update');
  const canDelete = hasPermission('event_type', 'delete');
  const canCreatePersonFields = hasPermission('person_field', 'create');
  const canUpdatePersonFields = hasPermission('person_field', 'update');
  const allColumnIds = useMemo<EventTypeColumnId[]>(
    () => [...EVENT_TYPE_COLUMN_IDS, ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : [])],
    [auth?.fullAccess],
  );
  const columnVisibility = useModuleColumnVisibility<EventTypeColumnId>({
    moduleKey: 'settings-event-types-list',
    allColumnIds,
    defaultVisibleColumnIds: DEFAULT_EVENT_TYPE_VISIBLE_COLUMNS,
    fixedColumnIds: ['actions'],
    defaultSearchColumnIds: ['name', 'description'],
  });
  const list = useEventTypesList({
    enabled: canView,
    columnsQuery: columnVisibility.columnsQuery,
    searchColumnsQuery: columnVisibility.searchColumnsQuery,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<EventType | null>(null);
  const [details, setDetails] = useState<EventType | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EventType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const loadEventType = useCallback(
    async (id: string) => {
      setLoadingId(id);
      try {
        return await httpRequest<EventType>({ service: EventTypesService.get, data: { id } });
      } catch (value) {
        showNotification(
          getErrorMessage(value instanceof Error ? value : null, t('pages.settings.eventTypes.error.loadOneFailed')),
          {
            severity: 'error',
          },
        );
        return null;
      } finally {
        setLoadingId(null);
      }
    },
    [showNotification, t],
  );

  const openCreate = useCallback(() => {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  }, []);

  useEffect(() => {
    const state = location.state as SettingsNavigationState | null;
    if (!state?.createEventType || !canCreate) return;
    openCreate();
    navigate(location.pathname, { replace: true, state: null });
  }, [canCreate, location.pathname, location.state, navigate, openCreate]);

  const openEdit = useCallback(
    async (row: EventType) => {
      const result = await loadEventType(row.id);
      if (!result) return;
      setFormMode('edit');
      setSelected(result);
      setFormOpen(true);
    },
    [loadEventType],
  );

  const openView = useCallback(
    async (row: EventType) => {
      const result = await loadEventType(row.id);
      if (result) setDetails(result);
    },
    [loadEventType],
  );

  const handleSubmit = async (values: EventTypeFormValues) => {
    setSubmitting(true);
    try {
      const isCreate = formMode === 'create';
      const customFields = await resolveEventFieldPersonLinks(values.custom_fields, {
        canCreatePersonFields,
        canUpdatePersonFields,
      });
      await httpRequest<EventType>({
        service: isCreate ? EventTypesService.create : EventTypesService.update,
        data: isCreate
          ? { ...values, custom_fields: customFields }
          : { id: selected?.id ?? '', ...values, custom_fields: customFields },
      });
      setFormOpen(false);
      setSelected(null);
      await list.refresh();
      showNotification(
        t(isCreate ? 'pages.settings.eventTypes.success.created' : 'pages.settings.eventTypes.success.updated'),
        { severity: 'success' },
      );
    } catch (value) {
      showNotification(
        getErrorMessage(value instanceof Error ? value : null, t('pages.settings.eventTypes.error.saveFailed')),
        {
          severity: 'error',
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await httpRequest({ service: EventTypesService.remove, data: { id: pendingDelete.id } });
      setPendingDelete(null);
      await list.refresh();
      showNotification(t('pages.settings.eventTypes.success.deleted'), { severity: 'success' });
    } catch (value) {
      showNotification(
        getErrorMessage(value instanceof Error ? value : null, t('pages.settings.eventTypes.error.deleteFailed')),
        {
          severity: 'error',
        },
      );
    } finally {
      setDeleting(false);
    }
  };

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<EventType>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<
    Array<
      {
        id: EventTypeColumnId;
        label: string;
        sortKey?: string;
      } & ModuleListColumn<EventType>
    >
  >(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id', minWidth: 260, render: (row) => row.id },
      {
        id: 'icon',
        label: t('pages.settings.eventTypes.fields.icon'),
        width: 56,
        align: 'center',
        render: (row) => <MuiIcon name={row.icon} sx={{ color: row.color }} />,
      },
      { id: 'name', label: t('form.field.name'), sortKey: 'name', minWidth: 180, render: (row) => row.name },
      {
        id: 'default_public',
        label: t('pages.settings.eventTypes.fields.defaultPublic'),
        sortKey: 'default_public',
        align: 'center',
        width: 110,
        render: (row) => <CrudPermissionStatus enabled={Boolean(row.default_public)} />,
      },
      {
        id: 'default_self_registration',
        label: t('pages.settings.eventTypes.fields.defaultSelfRegistration'),
        sortKey: 'default_self_registration',
        align: 'center',
        width: 140,
        render: (row) => <CrudPermissionStatus enabled={Boolean(row.default_self_registration)} />,
      },
      {
        id: 'attendance_enabled',
        label: t('pages.settings.eventTypes.fields.attendance'),
        sortKey: 'attendance_enabled',
        align: 'center',
        width: 130,
        render: (row) => <CrudPermissionStatus enabled={Boolean(row.attendance_enabled)} />,
      },
      {
        id: 'default_start_time',
        label: t('pages.settings.eventTypes.fields.defaultStartTime'),
        sortKey: 'default_start_time',
        width: 120,
        render: (row) => row.default_start_time?.slice(0, 5) || t('pages.modules.common.emptyValue'),
      },
      {
        id: 'default_duration_minutes',
        label: t('pages.settings.eventTypes.fields.defaultDuration'),
        sortKey: 'default_duration_minutes',
        width: 120,
        render: (row) => row.default_duration_minutes ?? t('pages.modules.common.emptyValue'),
      },
      {
        id: 'description',
        label: t('pages.settings.eventTypes.fields.description'),
        sortKey: 'description',
        minWidth: 240,
        render: (row) => (
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 420 }}>
            {row.description || t('pages.modules.common.emptyValue')}
          </Typography>
        ),
      },
      {
        id: 'enabled',
        label: t('pages.settings.eventTypes.fields.enabled'),
        sortKey: 'enabled',
        align: 'center',
        width: 110,
        render: (row) => <CrudPermissionStatus enabled={row.enabled} />,
      },
      ...auditColumnDefinitions,
      {
        id: 'actions',
        label: t('pages.settings.eventTypes.fields.actions'),
        align: 'right',
        minWidth: 150,
        render: (row) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'view',
                label: t('pages.modules.common.view'),
                icon: VisibilityOutlinedIcon,
                color: 'primary',
                disabled: loadingId === row.id,
                onClick: (value) => void openView(value),
              },
              {
                id: 'edit',
                label: t('pages.settings.eventTypes.actions.edit'),
                icon: EditOutlinedIcon,
                color: 'secondary',
                hidden: !canUpdate,
                disabled: loadingId === row.id,
                onClick: (value) => void openEdit(value),
              },
              {
                id: 'delete',
                label: t('pages.settings.eventTypes.actions.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete,
                onClick: setPendingDelete,
              },
            ]}
          />
        ),
      },
    ],
    [auditColumnDefinitions, canDelete, canUpdate, loadingId, openEdit, openView, t],
  );
  const visibleColumnDefinitions = useMemo(
    () =>
      columnDefinitions.filter(
        (column) => column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );
  const columns = useMemo<ModuleListColumn<EventType>[]>(
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
    <>
      <ModuleSection<EventType>
        title={t('pages.settings.eventTypes.title')}
        createAction={
          canCreate
            ? { id: 'create-event-type', label: t('pages.settings.eventTypes.actions.create'), onClick: openCreate }
            : undefined
        }
        refreshAction={{
          id: 'refresh-event-types',
          label: t('pages.modules.common.refresh'),
          onClick: () => void list.refresh(),
        }}
        alerts={list.error ? <Alert severity="error">{list.error}</Alert> : undefined}
        search={{
          label: t('pages.modules.common.search'),
          placeholder: t('pages.settings.eventTypes.searchPlaceholder'),
          value: list.search,
          onChange: list.setSearch,
        }}
        table={{
          headerRows,
          columns,
          rows: list.result,
          getRowId: (row) => row.id,
          loading: list.loading,
          loadingLabel: t('pages.settings.eventTypes.loading'),
          emptyLabel: t('pages.settings.eventTypes.empty'),
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
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as EventTypeColumnId[]),
          },
          fixedStartColumnIds: ['name'],
          fixedEndColumnIds: ['actions'],
        }}
      />

      <EventTypeFormDialog
        open={formOpen}
        mode={formMode}
        eventType={selected}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void handleSubmit(values)}
      />

      <EventTypeDetailsDialog
        open={Boolean(details)}
        eventType={details}
        editDisabled={!canUpdate}
        onClose={() => setDetails(null)}
        onEdit={() => {
          if (!details) return;
          setSelected(details);
          setFormMode('edit');
          setFormOpen(true);
          setDetails(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('pages.settings.eventTypes.dialogs.deleteTitle')}
        message={t('pages.settings.eventTypes.dialogs.deleteMessage', { name: pendingDelete?.name ?? '' })}
        confirmLabel={t('pages.settings.eventTypes.actions.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
};
