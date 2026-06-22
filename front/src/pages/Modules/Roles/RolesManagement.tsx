import { ConfirmDialog } from '@components/common/forms/ConfirmDialog';
import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { ModuleRowActions } from '@components/common/modules/ModuleRowActions';
import { ModuleSection } from '@components/common/modules/ModuleSection';
import { useAppContext } from '@hooks/useAppContext';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert } from '@mui/material';
import { PermissionsService } from '@services/permissions';
import { RolesService } from '@services/roles';
import { filterFeaturePermissionSections } from '@utils/feature-gates';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PermissionAction, PermissionSection } from '@/types/permission.types';
import type { Role } from '@/types/role.types';
import { RoleDetailsDialog } from './RoleDetailsDialog';
import { RoleFormDialog } from './RoleFormDialog';
import type { RoleDialogMode, RoleFormValues, RolePermissionColumn, RoleTableSchema } from './roles.types';
import { useRolesList } from './useRolesList';

const getErrorMessage = (value: unknown, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

const hasRolePermission = (role: Role, sectionId: string, action: PermissionAction): boolean => {
  if (role.full_access) return true;

  return role.permissions?.[sectionId]?.includes(action) ?? false;
};

const createRoleTableSchema = (
  sections: PermissionSection[],
  actions: PermissionAction[],
  t: (key: string, options?: Record<string, unknown>) => string,
): RoleTableSchema => {
  if (!sections.length || !actions.length) {
    return {
      headerRows: [
        [
          {
            id: 'name',
            label: t('pages.modules.roles.columns.role'),
            sortKey: 'name',
            rowSpan: 1,
          },
          {
            id: 'full-access',
            label: t('pages.modules.roles.columns.fullAccess'),
            align: 'center',
            rowSpan: 1,
          },
          {
            id: 'actions',
            label: t('pages.modules.roles.columns.actions'),
            align: 'right',
            rowSpan: 1,
          },
        ],
      ],
      permissionColumns: [],
    };
  }

  const permissionColumns: RolePermissionColumn[] = [];

  sections.forEach((section) => {
    actions
      .filter((action) => section.permissions.includes(action))
      .forEach((action) => {
        permissionColumns.push({
          id: `${section.id}-${action}`,
          sectionId: section.id,
          action,
        });
      });
  });

  return {
    headerRows: [
      [
        {
          id: 'name',
          label: t('pages.modules.roles.columns.role'),
          sortKey: 'name',
          rowSpan: 2,
        },
        {
          id: 'full-access',
          label: t('pages.modules.roles.columns.fullAccess'),
          align: 'center',
          rowSpan: 2,
        },
        ...sections.map((section) => ({
          id: `section-${section.id}`,
          label: t(`pages.modules.roles.permissions.sections.${section.id}`, {
            defaultValue: section.id,
          }),
          align: 'center' as const,
          colSpan: actions.filter((action) => section.permissions.includes(action)).length,
        })),
        {
          id: 'actions',
          label: t('pages.modules.roles.columns.actions'),
          align: 'right',
          rowSpan: 2,
        },
      ],
      permissionColumns.map((column) => ({
        id: column.id,
        label: t(`pages.modules.roles.columns.${column.action}`, {
          defaultValue: column.action,
        }),
        align: 'center' as const,
        sortKey: column.id,
      })),
    ],
    permissionColumns,
  };
};

export const RolesManagement = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotificationContext();
  const { congregation } = useAppContext();
  const { hasPermission } = useAuth();
  const canView = hasPermission('role', 'get');
  const canCreate = hasPermission('role', 'create');
  const canUpdate = hasPermission('role', 'update');
  const canDelete = hasPermission('role', 'delete');

  const {
    roles,
    total,
    loading,
    error: rolesError,
    refresh,
    search,
    setSearch,
    sort,
    direction,
    page,
    pageSize,
    handleSort,
    handleChangePage,
    handleChangeRowsPerPage,
  } = useRolesList({ enabled: canView });

  const [permissionSections, setPermissionSections] = useState<PermissionSection[]>([]);
  const [permissionActions, setPermissionActions] = useState<PermissionAction[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<RoleDialogMode>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleDetails, setRoleDetails] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);
  const [rolePendingDelete, setRolePendingDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isPermissionMetadataReady = permissionSections.length > 0 && permissionActions.length > 0;

  const refreshMetadata = useCallback(async () => {
    if (!canView) {
      setPermissionSections([]);
      setPermissionActions([]);
      setMetadataError('');
      setMetadataLoading(false);
      return;
    }

    setMetadataLoading(true);
    setMetadataError('');

    try {
      const [sections, actions] = await Promise.all([
        httpRequest<PermissionSection[]>({
          service: PermissionsService.list,
        }),
        httpRequest<PermissionAction[]>({
          service: PermissionsService.listActions,
        }),
      ]);

      setPermissionSections(filterFeaturePermissionSections(sections ?? [], congregation?.features));
      setPermissionActions(actions ?? []);
    } catch (value) {
      setMetadataError(getErrorMessage(value, t('pages.modules.roles.error.permissionsLoadFailed')));
    } finally {
      setMetadataLoading(false);
    }
  }, [canView, congregation?.features, t]);

  useEffect(() => {
    if (!canView) {
      setPermissionSections([]);
      setPermissionActions([]);
      setMetadataError('');
      setMetadataLoading(false);
      return;
    }

    void refreshMetadata();
  }, [canView, refreshMetadata]);

  const handleRefresh = () => {
    void Promise.all([refresh(), refreshMetadata()]);
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedRole(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setSelectedRole(null);
  };

  const handleOpenEdit = useCallback(
    async (roleId: string) => {
      setLoadingRoleId(roleId);

      try {
        const role = await httpRequest<Role>({
          service: RolesService.get,
          data: { id: roleId },
        });

        setDialogMode('edit');
        setSelectedRole(role);
        setDialogOpen(true);
      } catch (value) {
        showNotification(getErrorMessage(value, t('pages.modules.roles.error.loadRoleFailed')), {
          severity: 'error',
        });
      } finally {
        setLoadingRoleId(null);
      }
    },
    [showNotification, t],
  );

  const handleEditRoleDetails = useCallback(() => {
    if (!roleDetails) return;

    setDialogMode('edit');
    setSelectedRole(roleDetails);
    setDialogOpen(true);
    window.setTimeout(() => setRoleDetails(null), 0);
  }, [roleDetails]);

  const handleSubmitRole = useCallback(
    async (values: RoleFormValues) => {
      setSubmitting(true);

      try {
        if (dialogMode === 'create') {
          await httpRequest<Role>({
            service: RolesService.create,
            data: values,
          });

          showNotification(t('pages.modules.roles.success.created'), {
            severity: 'success',
          });
        } else if (selectedRole) {
          await httpRequest<Role>({
            service: RolesService.update,
            data: {
              id: selectedRole.id,
              ...values,
            },
          });

          showNotification(t('pages.modules.roles.success.updated'), {
            severity: 'success',
          });
        }

        setDialogOpen(false);
        setSelectedRole(null);
        await refresh();
      } catch (value) {
        showNotification(getErrorMessage(value, t('pages.modules.roles.error.saveFailed')), {
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [dialogMode, refresh, selectedRole, showNotification, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!rolePendingDelete) return;

    setDeleting(true);

    try {
      await httpRequest<{ deleted: boolean }>({
        service: RolesService.remove,
        data: {
          id: rolePendingDelete.id,
        },
      });

      showNotification(t('pages.modules.roles.success.deleted'), {
        severity: 'success',
      });
      setRolePendingDelete(null);
      await refresh();
    } catch (value) {
      showNotification(getErrorMessage(value, t('pages.modules.roles.error.deleteFailed')), {
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }, [refresh, rolePendingDelete, showNotification, t]);

  const tableSchema = useMemo(
    () => createRoleTableSchema(permissionSections, permissionActions, t),
    [permissionActions, permissionSections, t],
  );

  const columns = useMemo<ModuleListColumn<Role>[]>(
    () => [
      {
        id: 'name',
        minWidth: 220,
        render: (role) => role.name,
      },
      {
        id: 'full-access',
        minWidth: 96,
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={Boolean(role.full_access)} />,
      },
      ...tableSchema.permissionColumns.map(
        (column): ModuleListColumn<Role> => ({
          id: column.id,
          minWidth: 72,
          align: 'center',
          render: (role) => (
            <CrudPermissionStatus
              enabled={hasRolePermission(role, column.sectionId, column.action)}
              color={role.full_access ? 'darkSuccess' : 'default'}
            />
          ),
        }),
      ),
      {
        id: 'actions',
        minWidth: 148,
        align: 'right',
        render: (role) => (
          <ModuleRowActions
            row={role}
            actions={[
              {
                id: 'view-role',
                label: t('pages.modules.common.view'),
                icon: VisibilityOutlinedIcon,
                color: 'primary',
                disabled: metadataLoading || !isPermissionMetadataReady,
                onClick: (currentRole) => setRoleDetails(currentRole),
              },
              {
                id: 'edit-role',
                label: t('pages.modules.roles.actions.edit'),
                icon: EditOutlinedIcon,
                color: 'secondary',
                hidden: !canUpdate,
                disabled: (currentRole) =>
                  loadingRoleId === currentRole.id ||
                  submitting ||
                  deleting ||
                  metadataLoading ||
                  !isPermissionMetadataReady,
                onClick: (currentRole) => {
                  void handleOpenEdit(currentRole.id);
                },
              },
              {
                id: 'delete-role',
                label: t('pages.modules.roles.actions.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete,
                disabled: (currentRole) => loadingRoleId === currentRole.id || submitting || deleting,
                onClick: (currentRole) => setRolePendingDelete(currentRole),
              },
            ]}
          />
        ),
      },
    ],
    [
      canDelete,
      canUpdate,
      deleting,
      handleOpenEdit,
      isPermissionMetadataReady,
      loadingRoleId,
      metadataLoading,
      submitting,
      tableSchema.permissionColumns,
      t,
    ],
  );

  if (!canView) {
    return <Alert severity="warning">{t('pages.modules.roles.error.accessDenied')}</Alert>;
  }

  return (
    <ModuleSection<Role>
      createAction={
        canCreate
          ? {
              id: 'create-role',
              label: t('pages.modules.roles.actions.create'),
              disabled: metadataLoading || !isPermissionMetadataReady || submitting,
              onClick: handleOpenCreate,
            }
          : undefined
      }
      refreshAction={{
        id: 'refresh-roles',
        label: t('pages.modules.common.refresh'),
        disabled: loading || metadataLoading,
        onClick: handleRefresh,
      }}
      alerts={
        <>
          {rolesError ? <Alert severity="error">{rolesError}</Alert> : null}
          {metadataError ? <Alert severity="error">{metadataError}</Alert> : null}
        </>
      }
      search={{
        label: t('pages.modules.common.search'),
        placeholder: t('pages.modules.roles.searchPlaceholder'),
        value: search,
        onChange: setSearch,
        sx: {
          width: { xs: '100%', sm: 320 },
        },
      }}
      table={{
        headerRows: tableSchema.headerRows,
        columns,
        rows: roles,
        getRowId: (role) => role.id,
        loading,
        loadingLabel: t('pages.modules.roles.loading'),
        emptyLabel: t('pages.modules.roles.empty'),
        sort,
        direction,
        onSort: handleSort,
        page,
        pageSize,
        total,
        onPageChange: handleChangePage,
        onPageSizeChange: handleChangeRowsPerPage,
        rowsPerPageLabel: t('pages.modules.common.rowsPerPage'),
        fixedStartColumnIds: ['name'],
      }}
    >
      <RoleFormDialog
        open={dialogOpen}
        mode={dialogMode}
        role={selectedRole}
        sections={permissionSections}
        actions={permissionActions}
        submitting={submitting}
        onClose={handleCloseDialog}
        onSubmit={(values) => {
          void handleSubmitRole(values);
        }}
      />

      <RoleDetailsDialog
        open={Boolean(roleDetails)}
        role={roleDetails}
        sections={permissionSections}
        actions={permissionActions}
        editDisabled={submitting || deleting || metadataLoading || !isPermissionMetadataReady}
        onClose={() => setRoleDetails(null)}
        onEdit={canUpdate ? handleEditRoleDetails : undefined}
      />

      <ConfirmDialog
        open={Boolean(rolePendingDelete)}
        title={t('pages.modules.roles.dialogs.deleteTitle')}
        message={t('pages.modules.roles.dialogs.deleteMessage', {
          name: rolePendingDelete?.name ?? '',
        })}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={deleting}
        confirmColor="error"
        onClose={() => {
          if (deleting) return;
          setRolePendingDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </ModuleSection>
  );
};
