import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert } from '@mui/material';
import { EventFieldsService } from '@services/eventFields';
import { PersonFieldsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';
import { EventFieldFormDialog } from './EventFieldFormDialog';
import type { EventFieldFormValues, EventFieldsListResponse } from './eventFields.types';

export const EventFieldsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('event_field', 'get');
  const canCreate = hasPermission('event_field', 'create');
  const canUpdate = hasPermission('event_field', 'update');
  const canDelete = hasPermission('event_field', 'delete');
  const list = useModuleList({ moduleKey: 'settings-event-fields-list', defaultSort: 'label' });
  const [rows, setRows] = useState<EventField[]>([]);
  const [personFields, setPersonFields] = useState<PersonField[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<EventField | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EventField | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError('');
    try {
      const response = await httpRequest<EventFieldsListResponse>({
        service: EventFieldsService.list,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(list.debouncedSearch ? { search: list.debouncedSearch } : {}),
        },
      });
      setRows(response.result ?? []);
      setTotal(response.total ?? 0);
    } catch (value) {
      setError(value instanceof Error ? value.message : t('pages.settings.eventFields.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [canView, list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!hasPermission('person_field', 'get')) return;
    void httpRequest<{ result: PersonField[]; total: number }>({
      service: PersonFieldsService.list,
      data: { page: 0, size: 500, order: 'label', direction: 'ASC' },
    }).then(({ result }) => setPersonFields(result));
  }, [hasPermission]);

  const columns = useMemo<ModuleListColumn<EventField>[]>(
    () => [
      { id: 'label', minWidth: 180, render: (row) => row.label },
      { id: 'type', minWidth: 130, render: (row) => t(`pages.events.fields.types.${row.type}`) },
      {
        id: 'actions',
        align: 'right',
        width: 100,
        render: (row) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'edit',
                label: t('pages.settings.eventFields.edit'),
                icon: EditOutlinedIcon,
                hidden: !canUpdate,
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
                hidden: !canDelete,
                onClick: setPendingDelete,
              },
            ]}
          />
        ),
      },
    ],
    [canDelete, canUpdate, t],
  );

  const save = async (values: EventFieldFormValues) => {
    setSubmitting(true);
    try {
      await httpRequest<EventField>({
        service: selected ? EventFieldsService.update : EventFieldsService.create,
        data: { ...(selected ? { id: selected.id } : {}), ...values },
      });
      setFormOpen(false);
      setSelected(null);
      await refresh();
      showNotification(t('pages.settings.eventFields.saved'), { severity: 'success' });
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.settings.eventFields.saveFailed'), {
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
      await httpRequest({ service: EventFieldsService.remove, data: { id: pendingDelete.id } });
      setPendingDelete(null);
      await refresh();
      showNotification(t('pages.settings.eventFields.deleted'), { severity: 'success' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModuleSection<EventField>
        title={t('pages.settings.eventFields.title')}
        createAction={
          canCreate
            ? {
                id: 'create-event-field',
                label: t('pages.settings.eventFields.create'),
                onClick: () => {
                  setSelected(null);
                  setFormOpen(true);
                },
              }
            : undefined
        }
        refreshAction={{
          id: 'refresh-event-fields',
          label: t('pages.modules.common.refresh'),
          onClick: () => void refresh(),
        }}
        alerts={error ? <Alert severity="error">{error}</Alert> : undefined}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows: [
            [
              { id: 'label', label: t('pages.events.fields.label'), sortKey: 'label' },
              { id: 'type', label: t('pages.events.fields.type') },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
          columns,
          rows,
          getRowId: (row) => row.id,
          loading,
          loadingLabel: t('pages.settings.eventFields.loading'),
          emptyLabel: t('pages.settings.eventFields.empty'),
          sort: list.sort,
          direction: list.direction,
          onSort: list.handleSort,
          page: list.page,
          pageSize: list.pageSize,
          total,
          onPageChange: list.handleChangePage,
          onPageSizeChange: list.handleChangeRowsPerPage,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          fixedEndColumnIds: ['actions'],
        }}
      />

      <EventFieldFormDialog
        open={formOpen}
        mode={selected ? 'edit' : 'create'}
        field={selected}
        personFields={personFields}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => void save(values)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('form.common.delete')}
        message={t('pages.settings.eventFields.deleteMessage', { name: pendingDelete?.label ?? '' })}
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
