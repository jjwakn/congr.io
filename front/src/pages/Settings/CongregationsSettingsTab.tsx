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
import type { ListDirection } from '@components/common/modules/useModuleList.types';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { useSetup } from '@hooks/useSetup';
import { useTheme } from '@hooks/useTheme';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Alert, Typography } from '@mui/material';
import { ConfigurationsService } from '@services/configurations';
import { CongregationsService } from '@services/congregations';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Congregation } from '@/types/congregation.types';
import type { ThemePaletteConfig } from '@/types/theme.types';
import { CongregationCreateWizardDialog } from './CongregationCreateWizardDialog';
import { CongregationDeleteDialog } from './CongregationDeleteDialog';
import { CongregationEditDialog } from './CongregationEditDialog';
import type { CongregationCreateValues, CongregationDeletionPreview, CongregationEditValues } from './settings.types';

type CongregationColumnId = 'id' | 'name' | 'type' | 'timezone' | 'modules' | 'current' | 'actions' | CrudAuditColumnId;

const getErrorMessage = (value: Error | null, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

const getCongregationSortValue = (
  item: Congregation,
  sort: string,
  currentCongregationId: string | undefined,
): number | string => {
  if (sort === 'modules') return item.features?.length ?? 0;
  if (sort === 'current') return item.id === currentCongregationId ? 1 : 0;
  if (sort === 'created_at') return item.created_at ? String(item.created_at) : '';
  if (sort === 'updated_at') return item.updated_at ? String(item.updated_at) : '';
  if (sort === 'deleted_at') return item.deleted_at ? String(item.deleted_at) : '';
  if (sort === 'id') return item.id;
  if (sort === 'type') return item.type;
  if (sort === 'timezone') return item.timezone;
  return item.name;
};

export const CongregationsSettingsTab = () => {
  const { i18n, t } = useTranslation();
  const { congregation, refreshIsSetup, selectCongregation } = useAppContext();
  const { auth, user, hasPermission, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const { features } = useSetup();
  const { setPaletteConfig } = useTheme();
  const canCreate = hasPermission('congregation', 'create');
  const canUpdate = hasPermission('congregation', 'update');
  const canDelete = hasPermission('congregation', 'delete');
  const [sort, setSort] = useState<CongregationColumnId>('name');
  const [direction, setDirection] = useState<ListDirection>('ASC');
  const congregations = useMemo(() => {
    const collator = new Intl.Collator(i18n.language, { numeric: true, sensitivity: 'base' });

    return [...(user?.congregations ?? [])].sort((left, right) => {
      const leftValue = getCongregationSortValue(left, sort, congregation?.id);
      const rightValue = getCongregationSortValue(right, sort, congregation?.id);
      const result =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : collator.compare(String(leftValue), String(rightValue));

      return direction === 'ASC' ? result : -result;
    });
  }, [congregation?.id, direction, i18n.language, sort, user?.congregations]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCongregation, setEditCongregation] = useState<Congregation | null>(null);
  const [deleteCongregation, setDeleteCongregation] = useState<Congregation | null>(null);
  const [deletePreview, setDeletePreview] = useState<CongregationDeletionPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const allColumnIds = useMemo<CongregationColumnId[]>(
    () => [
      'id',
      'name',
      'type',
      'timezone',
      'modules',
      'current',
      ...(auth?.fullAccess ? CRUD_AUDIT_COLUMN_IDS : []),
      'actions',
    ],
    [auth?.fullAccess],
  );
  const columnVisibility = useModuleColumnVisibility<CongregationColumnId>({
    moduleKey: 'settings-congregations-list',
    allColumnIds,
    defaultVisibleColumnIds: ['name', 'type', 'timezone', 'modules', 'current', 'actions'],
    fixedColumnIds: ['name', 'actions'],
    defaultSearchColumnIds: ['name', 'type', 'timezone'],
  });

  const handleSort = useCallback(
    (value: string) => {
      const nextSort = value as CongregationColumnId;
      if (nextSort === sort) {
        setDirection((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
        return;
      }

      setSort(nextSort);
      setDirection('ASC');
    },
    [sort],
  );

  const handleCreate = async (values: CongregationCreateValues) => {
    setSubmitting(true);
    setError('');
    try {
      await httpRequest<Congregation>({
        service: CongregationsService.create,
        data: {
          ...values,
          locations: values.locations.map(({ order, name, address }) => ({ order, name, address })),
        },
      });
      await refreshSession();
      setCreateOpen(false);
      showNotification(t('pages.settings.congregation.created'), { severity: 'success' });
    } catch (value) {
      const message = getErrorMessage(
        value instanceof Error ? value : null,
        t('pages.settings.congregation.createFailed'),
      );
      setError(message);
      showNotification(message, { severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: CongregationEditValues) => {
    if (!editCongregation) return;
    setSubmitting(true);
    try {
      const updated = await httpRequest<Congregation>({
        service: CongregationsService.update,
        data: { id: editCongregation.id, ...values.congregation },
        headers: { 'X-Congregation-Id': editCongregation.id },
      });
      const palette = await httpRequest<ThemePaletteConfig>({
        service: ConfigurationsService.updateTheme,
        data: values.palette,
        headers: { 'X-Congregation-Id': editCongregation.id },
      });
      if (editCongregation.id === congregation?.id) {
        selectCongregation(updated);
        setPaletteConfig(palette);
      }
      await refreshSession();
      setEditCongregation(null);
      showNotification(t('pages.settings.success.saved'), { severity: 'success' });
    } catch (value) {
      showNotification(getErrorMessage(value instanceof Error ? value : null, t('pages.settings.error.saveFailed')), {
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = useCallback(
    async (item: Congregation) => {
      setLoadingDeleteId(item.id);
      setError('');
      try {
        const preview = await httpRequest<CongregationDeletionPreview>({
          service: CongregationsService.deletionPreview,
          data: { id: item.id },
          headers: { 'X-Congregation-Id': item.id },
        });
        setDeleteCongregation(item);
        setDeletePreview(preview);
      } catch (value) {
        const message = getErrorMessage(
          value instanceof Error ? value : null,
          t('pages.settings.congregation.delete.previewFailed'),
        );
        setError(message);
        showNotification(message, { severity: 'error' });
      } finally {
        setLoadingDeleteId(null);
      }
    },
    [showNotification, t],
  );

  const handleDelete = async () => {
    if (!deleteCongregation) return;
    setDeleting(true);
    try {
      await httpRequest({
        service: CongregationsService.remove,
        data: { id: deleteCongregation.id },
        headers: { 'X-Congregation-Id': deleteCongregation.id },
      });
      const deletedSelectedCongregation = deleteCongregation.id === congregation?.id;
      const remaining = congregations.filter(({ id }) => id !== deleteCongregation.id);
      setDeleteCongregation(null);
      setDeletePreview(null);
      await refreshSession();

      if (deletedSelectedCongregation && remaining.length) {
        const nextId = remaining[0].id;
        const [nextCongregation, nextPalette] = await Promise.all([
          httpRequest<Congregation>({
            service: CongregationsService.get,
            data: { id: nextId },
            headers: { 'X-Congregation-Id': nextId },
          }),
          httpRequest<ThemePaletteConfig>({
            service: ConfigurationsService.getTheme,
            headers: { 'X-Congregation-Id': nextId },
          }),
        ]);
        selectCongregation(nextCongregation);
        setPaletteConfig(nextPalette);
      } else if (deletedSelectedCongregation) {
        await refreshIsSetup();
      }

      showNotification(t('pages.settings.congregation.delete.success'), { severity: 'success' });
    } catch (value) {
      showNotification(
        getErrorMessage(value instanceof Error ? value : null, t('pages.settings.congregation.delete.failed')),
        { severity: 'error' },
      );
    } finally {
      setDeleting(false);
    }
  };

  const auditColumnDefinitions = useMemo(
    () =>
      auth?.fullAccess
        ? getCrudAuditColumnDefinitions<Congregation>({
            language: i18n.language,
            t,
          }).columns
        : [],
    [auth?.fullAccess, i18n.language, t],
  );

  const columnDefinitions = useMemo<ModuleListColumn<Congregation>[]>(
    () => [
      { id: 'id', minWidth: 220, render: (item) => item.id },
      { id: 'name', minWidth: 180, render: (item) => item.name },
      { id: 'type', minWidth: 140, render: (item) => item.type },
      { id: 'timezone', minWidth: 180, render: (item) => item.timezone },
      {
        id: 'modules',
        align: 'center',
        width: 110,
        render: (item) => item.features?.length ?? 0,
      },
      {
        id: 'current',
        align: 'center',
        width: 100,
        render: (item) => <CrudPermissionStatus enabled={item.id === congregation?.id} />,
      },
      ...auditColumnDefinitions,
      {
        id: 'actions',
        align: 'right',
        minWidth: 120,
        render: (item) => (
          <ModuleRowActions
            row={item}
            actions={[
              {
                id: 'edit',
                label: t('pages.settings.congregation.editAction'),
                icon: EditOutlinedIcon,
                color: 'secondary',
                hidden: !canUpdate,
                onClick: setEditCongregation,
              },
              {
                id: 'delete',
                label: t('pages.settings.congregation.delete.action'),
                tooltip: (value) =>
                  congregations.length <= 1
                    ? t('pages.settings.congregation.delete.lastCongregationTooltip')
                    : t('pages.settings.congregation.delete.action', { name: value.name }),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete,
                disabled: loadingDeleteId === item.id || congregations.length <= 1,
                onClick: (value) => void openDelete(value),
              },
            ]}
          />
        ),
      },
    ],
    [
      auditColumnDefinitions,
      canDelete,
      canUpdate,
      congregation?.id,
      congregations.length,
      loadingDeleteId,
      openDelete,
      t,
    ],
  );

  const headerDefinitions = useMemo<ModuleListHeaderCell[]>(
    () => [
      { id: 'id', label: t('pages.modules.common.id'), sortKey: 'id' },
      { id: 'name', label: t('form.field.name'), sortKey: 'name' },
      { id: 'type', label: t('form.field.type'), sortKey: 'type' },
      { id: 'timezone', label: t('form.field.timezone'), sortKey: 'timezone' },
      { id: 'modules', label: t('pages.settings.congregation.modules.column'), sortKey: 'modules', align: 'center' },
      { id: 'current', label: t('pages.settings.congregation.current'), sortKey: 'current', align: 'center' },
      ...auditColumnDefinitions.map(({ id, label, sortKey, align }) => ({ id, label, sortKey, align })),
      { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
    ],
    [auditColumnDefinitions, t],
  );

  const columns = useMemo<ModuleListColumn<Congregation>[]>(
    () =>
      columnDefinitions.filter(
        (column) =>
          column.id === 'actions' || columnVisibility.visibleColumnIds.includes(column.id as CongregationColumnId),
      ),
    [columnDefinitions, columnVisibility.visibleColumnIds],
  );

  const headerRows = useMemo<ModuleListHeaderCell[][]>(
    () => [
      headerDefinitions.filter(
        (cell) => cell.id === 'actions' || columnVisibility.visibleColumnIds.includes(cell.id as CongregationColumnId),
      ),
    ],
    [columnVisibility.visibleColumnIds, headerDefinitions],
  );

  return (
    <>
      <ModuleSection<Congregation>
        title={t('pages.settings.congregation.title')}
        createAction={
          canCreate
            ? {
                id: 'create-congregation',
                label: t('pages.settings.congregation.createAction'),
                onClick: () => setCreateOpen(true),
              }
            : undefined
        }
        refreshAction={{
          id: 'refresh-congregations',
          label: t('pages.modules.common.refresh'),
          onClick: () => void refreshSession(),
        }}
        alerts={error ? <Alert severity="error">{error}</Alert> : undefined}
        table={{
          headerRows,
          columns,
          rows: congregations,
          getRowId: (item) => item.id,
          loading: false,
          loadingLabel: t('pages.settings.congregation.loading'),
          emptyLabel: t('pages.settings.congregation.empty'),
          sort,
          direction,
          onSort: handleSort,
          page: 0,
          pageSize: 10,
          total: congregations.length,
          onPageChange: () => undefined,
          onPageSizeChange: () => undefined,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
          columnVisibility: {
            label: t('pages.modules.common.columns'),
            options: headerDefinitions.map((cell) => ({
              id: cell.id,
              label: cell.label,
              disabled: cell.id === 'name' || cell.id === 'actions',
            })),
            visibleIds: columnVisibility.visibleColumnIds,
            defaultVisibleIds: columnVisibility.defaultVisibleColumnIds,
            onChange: (value) => columnVisibility.setVisibleColumnIds(value as CongregationColumnId[]),
          },
          fixedStartColumnIds: ['name'],
          fixedEndColumnIds: ['actions'],
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('pages.settings.congregation.subtitle')}
        </Typography>
      </ModuleSection>

      {user?.id && createOpen ? (
        <CongregationCreateWizardDialog
          open
          submitting={submitting}
          currentUserId={user.id}
          features={features}
          onClose={() => setCreateOpen(false)}
          onSubmit={(values) => void handleCreate(values)}
        />
      ) : null}

      {editCongregation ? (
        <CongregationEditDialog
          congregation={editCongregation}
          features={features}
          selected={editCongregation.id === congregation?.id}
          submitting={submitting}
          onClose={() => setEditCongregation(null)}
          onSubmit={(values) => void handleEdit(values)}
        />
      ) : null}

      {deleteCongregation && deletePreview ? (
        <CongregationDeleteDialog
          congregation={deleteCongregation}
          preview={deletePreview}
          confirming={deleting}
          onClose={() => {
            if (deleting) return;
            setDeleteCongregation(null);
            setDeletePreview(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </>
  );
};
