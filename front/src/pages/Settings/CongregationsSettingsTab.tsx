import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
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

const getErrorMessage = (value: Error | null, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

export const CongregationsSettingsTab = () => {
  const { t } = useTranslation();
  const { congregation, refreshIsSetup, selectCongregation } = useAppContext();
  const { user, hasPermission, refreshSession } = useAuth();
  const { showNotification } = useNotificationContext();
  const { features } = useSetup();
  const { setPaletteConfig } = useTheme();
  const canCreate = hasPermission('congregation', 'create');
  const canUpdate = hasPermission('congregation', 'update');
  const canDelete = hasPermission('congregation', 'delete');
  const congregations = useMemo(
    () => [...(user?.congregations ?? [])].sort((left, right) => left.name.localeCompare(right.name)),
    [user?.congregations],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editCongregation, setEditCongregation] = useState<Congregation | null>(null);
  const [deleteCongregation, setDeleteCongregation] = useState<Congregation | null>(null);
  const [deletePreview, setDeletePreview] = useState<CongregationDeletionPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

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

  const columns = useMemo<ModuleListColumn<Congregation>[]>(
    () => [
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
    [canDelete, canUpdate, congregation?.id, congregations.length, loadingDeleteId, openDelete, t],
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
          headerRows: [
            [
              { id: 'name', label: t('form.field.name') },
              { id: 'type', label: t('form.field.type') },
              { id: 'timezone', label: t('form.field.timezone') },
              { id: 'modules', label: t('pages.settings.congregation.modules.column'), align: 'center' },
              { id: 'current', label: t('pages.settings.congregation.current'), align: 'center' },
              { id: 'actions', label: t('pages.settings.congregation.actions'), align: 'right' },
            ],
          ],
          columns,
          rows: congregations,
          getRowId: (item) => item.id,
          loading: false,
          loadingLabel: t('pages.settings.congregation.loading'),
          emptyLabel: t('pages.settings.congregation.empty'),
          sort: 'name',
          direction: 'ASC',
          onSort: () => undefined,
          page: 0,
          pageSize: 10,
          total: congregations.length,
          onPageChange: () => undefined,
          onPageSizeChange: () => undefined,
          rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
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
