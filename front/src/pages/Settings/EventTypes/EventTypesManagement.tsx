import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, Typography } from '@mui/material';
import { EventTypesService } from '@services/eventTypes';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventType } from '@/types/event-type.types';
import { EventTypeDetailsDialog } from './EventTypeDetailsDialog';
import { EventTypeFormDialog } from './EventTypeFormDialog';
import type { EventTypeFormValues } from './eventTypes.types';
import { useEventTypesList } from './useEventTypesList';

const getErrorMessage = (value: unknown, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

export const EventTypesManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('event_type', 'get');
  const canCreate = hasPermission('event_type', 'create');
  const canUpdate = hasPermission('event_type', 'update');
  const canDelete = hasPermission('event_type', 'delete');
  const list = useEventTypesList({ enabled: canView });
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
        showNotification(getErrorMessage(value, t('pages.settings.eventTypes.error.loadOneFailed')), {
          severity: 'error',
        });
        return null;
      } finally {
        setLoadingId(null);
      }
    },
    [showNotification, t],
  );

  const openCreate = () => {
    setFormMode('create');
    setSelected(null);
    setFormOpen(true);
  };

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
      await httpRequest<EventType>({
        service: isCreate ? EventTypesService.create : EventTypesService.update,
        data: isCreate ? values : { id: selected?.id ?? '', ...values },
      });
      setFormOpen(false);
      setSelected(null);
      await list.refresh();
      showNotification(
        t(isCreate ? 'pages.settings.eventTypes.success.created' : 'pages.settings.eventTypes.success.updated'),
        { severity: 'success' },
      );
    } catch (value) {
      showNotification(getErrorMessage(value, t('pages.settings.eventTypes.error.saveFailed')), { severity: 'error' });
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
      showNotification(getErrorMessage(value, t('pages.settings.eventTypes.error.deleteFailed')), {
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<ModuleListColumn<EventType>[]>(
    () => [
      { id: 'name', minWidth: 180, render: (row) => row.name },
      {
        id: 'description',
        minWidth: 240,
        render: (row) => (
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 420 }}>
            {row.description || t('pages.modules.common.emptyValue')}
          </Typography>
        ),
      },
      { id: 'enabled', align: 'center', width: 110, render: (row) => <CrudPermissionStatus enabled={row.enabled} /> },
      {
        id: 'actions',
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
    [canDelete, canUpdate, loadingId, openEdit, openView, t],
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
          headerRows: [
            [
              { id: 'name', label: t('form.field.name'), sortKey: 'name' },
              { id: 'description', label: t('pages.settings.eventTypes.fields.description') },
              {
                id: 'enabled',
                label: t('pages.settings.eventTypes.fields.enabled'),
                align: 'center',
                sortKey: 'enabled',
              },
              { id: 'actions', label: t('pages.settings.eventTypes.fields.actions'), align: 'right' },
            ],
          ],
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
