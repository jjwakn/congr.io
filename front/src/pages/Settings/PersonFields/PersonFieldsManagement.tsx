import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
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
import type { PersonField } from '@/types/person.types';
import { PersonFieldSettingsFormDialog } from './PersonFieldSettingsFormDialog';
import type { PersonFieldFormValues } from './personFields.types';
import { usePersonFieldsList } from './usePersonFieldsList';

type PersonFieldRow = PersonField & { persistent?: boolean };

export const PersonFieldsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const canView = hasPermission('person_field', 'get');
  const canCreate = hasPermission('person_field', 'create');
  const canUpdate = hasPermission('person_field', 'update');
  const canDelete = hasPermission('person_field', 'delete');
  const list = usePersonFieldsList(canView);
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

  const columns = useMemo<ModuleListColumn<PersonFieldRow>[]>(
    () => [
      { id: 'label', minWidth: 180, render: (row) => row.label },
      { id: 'type', minWidth: 120, render: (row) => t(`pages.persons.fieldTypes.${row.type}`) },
      {
        id: 'options',
        minWidth: 180,
        render: (row) => (row.options?.length ? row.options.join(', ') : t('pages.modules.common.emptyValue')),
      },
      {
        id: 'actions',
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
    [canDelete, canUpdate, t],
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
          headerRows: [
            [
              { id: 'label', label: t('pages.persons.fieldsCrud.label'), sortKey: 'label' },
              { id: 'type', label: t('pages.persons.fieldsCrud.type') },
              { id: 'options', label: t('pages.persons.fieldsCrud.options') },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
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
