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
import {
  CREATE_PERSON_FIELD_FROM_EVENT_FIELD,
  STANDARD_EVENT_FIELDS,
  STANDARD_PERSON_FIELDS,
} from '@utils/customFields';
import { toPersonFieldType } from '@utils/eventFieldLinks';
import { httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventField } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';
import { EventFieldFormDialog } from './EventFieldFormDialog';
import type { EventFieldFormValues, EventFieldsListResponse } from './eventFields.types';

type EventFieldRow = EventField & { persistent?: boolean };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const EventFieldsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('event_field', 'get');
  const canCreate = hasPermission('event_field', 'create');
  const canUpdate = hasPermission('event_field', 'update');
  const canDelete = hasPermission('event_field', 'delete');
  const list = useModuleList({ moduleKey: 'settings-event-fields-list', defaultSort: 'label' });
  const [rows, setRows] = useState<EventFieldRow[]>([]);
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

  const visibleRows = useMemo<EventFieldRow[]>(
    () => [
      ...STANDARD_EVENT_FIELDS.map(
        (field) =>
          ({
            id: field.id,
            label: t(field.labelKey),
            type: field.type,
            options: field.options,
            required: false,
            user_fillable: false,
            enabled: true,
            congregation_id: '',
            persistent: true,
          }) as EventFieldRow,
      ),
      ...rows,
    ],
    [rows, t],
  );
  const personFieldLabels = useMemo(
    () =>
      new Map([
        ...STANDARD_PERSON_FIELDS.map((field) => [field.id, t(field.labelKey)] as const),
        ...personFields.map((field) => [field.id, field.label] as const),
      ]),
    [personFields, t],
  );

  const columns = useMemo<ModuleListColumn<EventFieldRow>[]>(
    () => [
      { id: 'label', minWidth: 180, render: (row) => row.label },
      { id: 'type', minWidth: 130, render: (row) => t(`pages.events.fields.types.${row.type}`) },
      {
        id: 'options',
        minWidth: 180,
        render: (row) => (row.options?.length ? row.options.join(', ') : t('pages.modules.common.emptyValue')),
      },
      {
        id: 'person_field_id',
        minWidth: 180,
        render: (row) =>
          row.link_person_field && row.person_field_id
            ? (personFieldLabels.get(row.person_field_id) ?? row.person_field_id)
            : t('pages.modules.common.emptyValue'),
      },
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
    [canDelete, canUpdate, personFieldLabels, t],
  );

  const save = async (values: EventFieldFormValues) => {
    setSubmitting(true);
    try {
      let nextValues = values;
      if (values.link_person_field && values.person_field_id === CREATE_PERSON_FIELD_FROM_EVENT_FIELD) {
        const createdPersonField = await httpRequest<PersonField>({
          service: PersonFieldsService.create,
          data: {
            label: values.label,
            type: toPersonFieldType(values.type),
            required: false,
            allow_multiple: values.type === 'options' ? values.allow_multiple : false,
            options: values.type === 'options' ? values.options : [],
            calculated_conditions: values.type === 'yes_no' ? values.calculated_conditions : [],
          },
        });
        setPersonFields((current) => [...current, createdPersonField]);
        nextValues = { ...values, person_field_id: createdPersonField.id };
      } else if (values.link_person_field && values.person_field_id && UUID_PATTERN.test(values.person_field_id)) {
        const existingPersonField = await httpRequest<PersonField>({
          service: PersonFieldsService.get,
          data: { id: values.person_field_id },
        });
        const updatedPersonField = await httpRequest<PersonField>({
          service: PersonFieldsService.update,
          data: {
            id: existingPersonField.id,
            label: existingPersonField.label,
            type: toPersonFieldType(values.type),
            required: existingPersonField.required,
            allow_multiple: values.type === 'options' ? values.allow_multiple : false,
            options: values.type === 'options' ? values.options : [],
            calculated_conditions: values.type === 'yes_no' ? values.calculated_conditions : [],
            enabled: existingPersonField.enabled,
          },
        });
        setPersonFields((current) =>
          current.map((personField) => (personField.id === updatedPersonField.id ? updatedPersonField : personField)),
        );
      }
      await httpRequest<EventField>({
        service: selected ? EventFieldsService.update : EventFieldsService.create,
        data: { ...(selected ? { id: selected.id } : {}), ...nextValues },
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
      <ModuleSection<EventFieldRow>
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
              { id: 'options', label: t('pages.events.fields.options') },
              { id: 'person_field_id', label: t('pages.events.fields.personField') },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
          columns,
          rows: visibleRows,
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
        eventFields={rows}
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
