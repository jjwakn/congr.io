import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useModuleList } from '@components/common/modules/useModuleList';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { PersonFieldsService, PersonsService } from '@services/persons';
import { calculateAgeFromBirthdate, calculateDisplayedRegisteredAge } from '@utils/datetime';
import { httpRequest } from '@utils/http';
import { getPreloadedResource } from '@utils/preload';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Person, PersonField } from '@/types/person.types';
import { PersonDetailsDialog } from './PersonDetailsDialog';
import { PersonFormDialog } from './PersonFormDialog';
import type { PersonFieldFormValues, PersonFormValues } from './persons.types';

export const PersonsManagement = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
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
  }, [list.debouncedSearch, list.direction, list.page, list.pageSize, list.sort, showNotification, t]);
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
            ? (calculateAgeFromBirthdate(row.birthdate) ?? '-')
            : (calculateDisplayedRegisteredAge(row.registered_age, row.age_recorded_at) ?? '-'),
      },
      {
        id: 'actions',
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
    [hasPermission, loadingPersonId, openDetails, openEdit, t],
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
          headerRows: [
            [
              { id: 'code', label: t('pages.persons.fields.code'), sortKey: 'code' },
              { id: 'name', label: t('form.field.name'), sortKey: 'last_name' },
              { id: 'phone', label: t('pages.persons.fields.phone'), sortKey: 'phone' },
              { id: 'age', label: t('pages.persons.fields.age'), sortKey: 'registered_age' },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
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
