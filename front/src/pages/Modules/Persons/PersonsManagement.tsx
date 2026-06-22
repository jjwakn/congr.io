import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Tab, Tabs } from '@mui/material';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { httpRequest } from '@utils/http';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Person, PersonField } from '@/types/person.types';
import { PersonDetailsDialog } from './PersonDetailsDialog';
import { PersonFieldFormDialog } from './PersonFieldFormDialog';
import { PersonFormDialog } from './PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from './persons.types';

export const PersonsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { showNotification } = useNotificationContext();
  const [tab, setTab] = useState<'persons' | 'fields'>('persons');
  const [rows, setRows] = useState<Person[]>([]);
  const [fields, setFields] = useState<PersonField[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>();
  const [editField, setEditField] = useState<PersonField | null>();
  const [personOpen, setPersonOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; kind: 'person' | 'field' }>();
  const [submitting, setSubmitting] = useState(false);
  const [detailPerson, setDetailPerson] = useState<Person>();
  const list = useModuleList({
    moduleKey: tab === 'persons' ? 'members-list' : 'person-fields-list',
    defaultSort: tab === 'persons' ? 'last_name' : 'label',
  });
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const service = tab === 'persons' ? PersonsService.list : PersonFieldsService.list;
      const response = await httpRequest<{ result: Array<Person | PersonField>; total: number }>({
        service,
        data: {
          page: list.page,
          size: list.pageSize,
          order: list.sort,
          direction: list.direction,
          ...(list.search ? { search: list.search } : {}),
        },
      });
      if (tab === 'persons') setRows(response.result as Person[]);
      else setFields(response.result as PersonField[]);
      setTotal(response.total);
    } catch (value) {
      showNotification(value instanceof Error ? value.message : t('pages.persons.loadFailed'), { severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [list.direction, list.page, list.pageSize, list.search, list.sort, showNotification, t, tab]);
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
  const personColumns = useMemo(
    () => [
      { id: 'code', minWidth: 90, render: (row: Person) => row.code },
      {
        id: 'name',
        minWidth: 180,
        render: (row: Person) =>
          [row.first_name, row.middle_name, row.last_name, row.second_last_name].filter(Boolean).join(' '),
      },
      { id: 'phone', minWidth: 140, render: (row: Person) => row.phone },
      {
        id: 'age',
        width: 80,
        render: (row: Person) =>
          row.birthdate
            ? Math.floor(DateTime.now().diff(DateTime.fromISO(row.birthdate), 'years').years)
            : (row.registered_age ?? '-'),
      },
      {
        id: 'actions',
        width: 130,
        align: 'right' as const,
        render: (row: Person) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'view',
                label: t('pages.modules.common.view'),
                icon: VisibilityOutlinedIcon,
                onClick: setDetailPerson,
              },
              {
                id: 'edit',
                label: t('pages.persons.edit'),
                icon: EditOutlinedIcon,
                hidden: !hasPermission('person', 'update'),
                onClick: (value) => {
                  setEditPerson(value);
                  setPersonOpen(true);
                },
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
    [hasPermission, t],
  );
  const fieldColumns = useMemo(
    () => [
      { id: 'label', minWidth: 180, render: (row: PersonField) => row.label },
      { id: 'type', minWidth: 120, render: (row: PersonField) => t(`pages.persons.fieldTypes.${row.type}`) },
      {
        id: 'actions',
        width: 100,
        align: 'right' as const,
        render: (row: PersonField) => (
          <ModuleRowActions
            row={row}
            actions={[
              {
                id: 'edit',
                label: t('pages.persons.edit'),
                icon: EditOutlinedIcon,
                hidden: !hasPermission('person_field', 'update'),
                onClick: (value) => {
                  setEditField(value);
                  setFieldOpen(true);
                },
              },
              {
                id: 'delete',
                label: t('form.common.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !hasPermission('person_field', 'delete'),
                onClick: (value) => setPendingDelete({ id: value.id, kind: 'field' }),
              },
            ]}
          />
        ),
      },
    ],
    [hasPermission, t],
  );
  const savePerson = async (values: PersonFormValues) => {
    setSubmitting(true);
    try {
      await httpRequest({
        service: editPerson ? PersonsService.update : PersonsService.create,
        data: { ...(editPerson ? { id: editPerson.id } : {}), ...values },
      });
      setPersonOpen(false);
      setEditPerson(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };
  const saveField = async (values: PersonFieldFormValues) => {
    setSubmitting(true);
    try {
      await httpRequest({
        service: editField ? PersonFieldsService.update : PersonFieldsService.create,
        data: { ...(editField ? { id: editField.id } : {}), ...values },
      });
      setFieldOpen(false);
      setEditField(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
        <Tab value="persons" label={t('pages.persons.tabs.persons')} />
        {hasPermission('person_field', 'get') ? <Tab value="fields" label={t('pages.persons.tabs.fields')} /> : null}
      </Tabs>
      <ModuleSection
        title={t(tab === 'persons' ? 'pages.persons.title' : 'pages.persons.fieldsTitle')}
        createAction={
          (tab === 'persons' ? hasPermission('person', 'create') : hasPermission('person_field', 'create'))
            ? {
                id: 'create',
                label: t('form.field.add'),
                onClick: () => (tab === 'persons' ? setPersonOpen(true) : setFieldOpen(true)),
              }
            : undefined
        }
        refreshAction={{ id: 'refresh', label: t('pages.modules.common.refresh'), onClick: () => void refresh() }}
        search={{ label: t('pages.modules.common.search'), value: list.search, onChange: list.setSearch }}
        table={{
          headerRows: [
            tab === 'persons'
              ? [
                  { id: 'code', label: t('pages.persons.fields.code') },
                  { id: 'name', label: t('form.field.name') },
                  { id: 'phone', label: t('pages.persons.fields.phone') },
                  { id: 'age', label: t('pages.persons.fields.age') },
                  { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
                ]
              : [
                  { id: 'label', label: t('pages.persons.fieldsCrud.label') },
                  { id: 'type', label: t('pages.persons.fieldsCrud.type') },
                  { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
                ],
          ],
          columns: (tab === 'persons' ? personColumns : fieldColumns) as never,
          rows: (tab === 'persons' ? rows : fields) as never,
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
        }}
      />
      {personOpen ? (
        <PersonFormDialog
          open
          person={editPerson ?? null}
          fields={fields}
          submitting={submitting}
          onClose={() => {
            setPersonOpen(false);
            setEditPerson(null);
          }}
          onSubmit={(v) => void savePerson(v)}
        />
      ) : null}
      {fieldOpen ? (
        <PersonFieldFormDialog
          open
          field={editField ?? null}
          submitting={submitting}
          onClose={() => {
            setFieldOpen(false);
            setEditField(null);
          }}
          onSubmit={(v) => void saveField(v)}
        />
      ) : null}
      {detailPerson ? (
        <PersonDetailsDialog person={detailPerson} fields={fields} onClose={() => setDetailPerson(undefined)} />
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
                service: pendingDelete.kind === 'person' ? PersonsService.remove : PersonFieldsService.remove,
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
    </>
  );
};

export default PersonsManagement;
