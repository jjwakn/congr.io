import { PasswordChangeDialog } from '@components/auth/PasswordChangeDialog';
import type { PasswordChangeValues } from '@components/auth/PasswordChangeDialog.types';
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
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { Alert } from '@mui/material';
import { RolesService } from '@services/roles';
import { UsersService } from '@services/users';
import { HttpRequestError, httpRequest } from '@utils/http';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Congregation, Location } from '@/types/congregation.types';
import type { Role } from '@/types/role.types';
import type { User } from '@/types/user.types';
import { UserDetailsDialog } from './UserDetailsDialog';
import { UserFormDialog } from './UserFormDialog';
import { useUsersList } from './useUsersList';
import type { UserDialogMode, UserFormValues, UserMetadata } from './users.types';

const getErrorMessage = (value: Error | null, fallback: string) =>
  value instanceof HttpRequestError || value instanceof Error ? value.message : fallback;

const mergeById = <Entity extends { id: string }>(primary: Entity[], secondary: Entity[] = []) => {
  const merged = new Map<string, Entity>();

  primary.forEach((entity) => merged.set(entity.id, entity));
  secondary.forEach((entity) => merged.set(entity.id, entity));

  return Array.from(merged.values());
};

export const UsersManagement = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotificationContext();
  const { congregation } = useAppContext();
  const { user: authUser, hasPermission, refreshSession } = useAuth();
  const canView = hasPermission('user', 'get');
  const canCreate = hasPermission('user', 'create');
  const canUpdate = hasPermission('user', 'update');
  const canDelete = hasPermission('user', 'delete');
  const canChangePassword = hasPermission('user', 'change_password');

  const {
    users,
    total,
    loading,
    error: usersError,
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
  } = useUsersList({ enabled: canView });

  const [roles, setRoles] = useState<Role[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<UserDialogMode>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [userPendingDelete, setUserPendingDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const congregationOptions = useMemo<Congregation[]>(() => (congregation ? [congregation] : []), [congregation]);
  const locationOptions = useMemo<Location[]>(() => congregation?.locations ?? [], [congregation?.locations]);

  const metadata = useMemo<UserMetadata>(
    () => ({
      roles,
      congregations: congregationOptions,
      locations: locationOptions,
    }),
    [congregationOptions, locationOptions, roles],
  );

  const dialogMetadata = useMemo<UserMetadata>(
    () => ({
      roles: mergeById(metadata.roles, selectedUser?.roles),
      congregations: mergeById(metadata.congregations, selectedUser?.congregations),
      locations: mergeById(metadata.locations, selectedUser?.locations),
    }),
    [metadata, selectedUser],
  );

  const isCurrentUser = useCallback(
    (value: User | null | undefined) => Boolean(authUser?.id && value?.id === authUser.id),
    [authUser?.id],
  );

  const refreshMetadata = useCallback(async () => {
    if (!canView) {
      setRoles([]);
      setMetadataError('');
      setMetadataLoading(false);
      return;
    }

    setMetadataLoading(true);
    setMetadataError('');

    try {
      const response = await httpRequest<{ result: Role[]; total: number }>({
        service: RolesService.list,
        data: {
          page: 0,
          size: 1000,
          order: 'name',
          direction: 'ASC',
          enabled: true,
        },
      });

      setRoles(response.result ?? []);
    } catch (value) {
      setMetadataError(
        getErrorMessage(value instanceof Error ? value : null, t('pages.modules.users.error.rolesLoadFailed')),
      );
    } finally {
      setMetadataLoading(false);
    }
  }, [canView, t]);

  useEffect(() => {
    if (!canView) {
      setRoles([]);
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
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
    setSelectedUser(null);
  };

  const loadUser = useCallback(
    async (userId: string, fallback: string) => {
      setLoadingUserId(userId);

      try {
        return await httpRequest<User>({
          service: UsersService.get,
          data: { id: userId },
        });
      } catch (value) {
        showNotification(getErrorMessage(value instanceof Error ? value : null, fallback), {
          severity: 'error',
        });
        return null;
      } finally {
        setLoadingUserId(null);
      }
    },
    [showNotification],
  );

  const handleOpenDetails = useCallback(
    async (userId: string) => {
      const user = await loadUser(userId, t('pages.modules.users.error.loadUserFailed'));
      if (user) setUserDetails(user);
    },
    [loadUser, t],
  );

  const handleOpenEdit = useCallback(
    async (userId: string) => {
      const user = await loadUser(userId, t('pages.modules.users.error.loadUserFailed'));
      if (!user) return;

      setDialogMode('edit');
      setSelectedUser(user);
      setDialogOpen(true);
    },
    [loadUser, t],
  );

  const handleEditUserDetails = useCallback(() => {
    if (!userDetails) return;

    setDialogMode('edit');
    setSelectedUser(userDetails);
    setDialogOpen(true);
    window.setTimeout(() => setUserDetails(null), 0);
  }, [userDetails]);

  const handleSubmitUser = useCallback(
    async (values: UserFormValues) => {
      setSubmitting(true);

      try {
        if (dialogMode === 'create') {
          await httpRequest<User>({
            service: UsersService.create,
            data: values,
          });

          showNotification(t('pages.modules.users.success.created'), {
            severity: 'success',
          });
        } else if (selectedUser) {
          await httpRequest<User>({
            service: UsersService.update,
            data: isCurrentUser(selectedUser)
              ? {
                  id: selectedUser.id,
                  name: values.name,
                }
              : {
                  id: selectedUser.id,
                  ...values,
                },
          });

          showNotification(t('pages.modules.users.success.updated'), {
            severity: 'success',
          });

          if (isCurrentUser(selectedUser)) await refreshSession();
        }

        setDialogOpen(false);
        setSelectedUser(null);
        await refresh();
      } catch (value) {
        showNotification(
          getErrorMessage(value instanceof Error ? value : null, t('pages.modules.users.error.saveFailed')),
          {
            severity: 'error',
          },
        );
      } finally {
        setSubmitting(false);
      }
    },
    [dialogMode, isCurrentUser, refresh, refreshSession, selectedUser, showNotification, t],
  );

  const handleClosePasswordDialog = () => {
    if (passwordSubmitting) return;

    setPasswordUser(null);
  };

  const handleSubmitPassword = useCallback(
    async (values: PasswordChangeValues) => {
      if (!passwordUser) return;

      const isOwnPassword = isCurrentUser(passwordUser);
      setPasswordSubmitting(true);

      try {
        await httpRequest<User>({
          service: isOwnPassword ? UsersService.changeOwnPassword : UsersService.setTemporaryPassword,
          data: isOwnPassword
            ? values
            : {
                id: passwordUser.id,
                password: values.password,
                password_confirmation: values.password_confirmation,
              },
        });

        showNotification(
          t(
            isOwnPassword
              ? 'pages.modules.users.success.passwordUpdated'
              : 'pages.modules.users.success.temporaryPasswordSet',
          ),
          {
            severity: 'success',
          },
        );

        setPasswordUser(null);
        if (isOwnPassword) await refreshSession();
        await refresh();
      } catch (value) {
        showNotification(
          getErrorMessage(value instanceof Error ? value : null, t('pages.modules.users.error.changePasswordFailed')),
          {
            severity: 'error',
          },
        );
      } finally {
        setPasswordSubmitting(false);
      }
    },
    [isCurrentUser, passwordUser, refresh, refreshSession, showNotification, t],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!userPendingDelete) return;

    setDeleting(true);

    try {
      await httpRequest<{ deleted: boolean }>({
        service: UsersService.remove,
        data: {
          id: userPendingDelete.id,
        },
      });

      showNotification(t('pages.modules.users.success.deleted'), {
        severity: 'success',
      });
      setUserPendingDelete(null);
      await refresh();
    } catch (value) {
      showNotification(
        getErrorMessage(value instanceof Error ? value : null, t('pages.modules.users.error.deleteFailed')),
        {
          severity: 'error',
        },
      );
    } finally {
      setDeleting(false);
    }
  }, [refresh, showNotification, t, userPendingDelete]);

  const columns = useMemo<ModuleListColumn<User>[]>(
    () => [
      {
        id: 'name',
        minWidth: 220,
        render: (user) => user.name,
      },
      {
        id: 'username',
        minWidth: 180,
        render: (user) => user.username,
      },
      {
        id: 'enabled',
        minWidth: 96,
        align: 'center',
        render: (user) => <CrudPermissionStatus enabled={Boolean(user.enabled)} />,
      },
      {
        id: 'actions',
        minWidth: 188,
        align: 'right',
        render: (user) => (
          <ModuleRowActions
            row={user}
            actions={[
              {
                id: 'view-user',
                label: t('pages.modules.common.view'),
                icon: VisibilityOutlinedIcon,
                color: 'primary',
                disabled: (currentUser) => loadingUserId === currentUser.id,
                onClick: (currentUser) => {
                  void handleOpenDetails(currentUser.id);
                },
              },
              {
                id: 'edit-user',
                label: t('pages.modules.users.actions.edit'),
                icon: EditOutlinedIcon,
                color: 'secondary',
                hidden: !canUpdate,
                disabled: (currentUser) =>
                  loadingUserId === currentUser.id || submitting || deleting || passwordSubmitting || metadataLoading,
                onClick: (currentUser) => {
                  void handleOpenEdit(currentUser.id);
                },
              },
              {
                id: 'change-user-password',
                label: isCurrentUser(user)
                  ? t('pages.modules.users.actions.changeOwnPassword')
                  : t('pages.modules.users.actions.setTemporaryPassword'),
                icon: VpnKeyOutlinedIcon,
                color: 'default',
                hidden: (currentUser) => !isCurrentUser(currentUser) && !canChangePassword,
                disabled: (currentUser) =>
                  loadingUserId === currentUser.id || submitting || deleting || passwordSubmitting,
                onClick: (currentUser) => setPasswordUser(currentUser),
              },
              {
                id: 'delete-user',
                label: t('pages.modules.users.actions.delete'),
                icon: DeleteOutlineRoundedIcon,
                color: 'error',
                hidden: !canDelete,
                disabled: (currentUser) =>
                  isCurrentUser(currentUser) ||
                  loadingUserId === currentUser.id ||
                  submitting ||
                  deleting ||
                  passwordSubmitting,
                onClick: (currentUser) => setUserPendingDelete(currentUser),
              },
            ]}
          />
        ),
      },
    ],
    [
      canChangePassword,
      canDelete,
      canUpdate,
      deleting,
      handleOpenDetails,
      handleOpenEdit,
      isCurrentUser,
      loadingUserId,
      metadataLoading,
      passwordSubmitting,
      submitting,
      t,
    ],
  );

  if (!canView) {
    return <Alert severity="warning">{t('pages.modules.users.error.accessDenied')}</Alert>;
  }

  return (
    <ModuleSection<User>
      createAction={
        canCreate
          ? {
              id: 'create-user',
              label: t('pages.modules.users.actions.create'),
              disabled: metadataLoading || submitting,
              onClick: handleOpenCreate,
            }
          : undefined
      }
      refreshAction={{
        id: 'refresh-users',
        label: t('pages.modules.common.refresh'),
        disabled: loading || metadataLoading,
        onClick: handleRefresh,
      }}
      alerts={
        <>
          {usersError ? <Alert severity="error">{usersError}</Alert> : null}
          {metadataError ? <Alert severity="error">{metadataError}</Alert> : null}
        </>
      }
      search={{
        label: t('pages.modules.common.search'),
        placeholder: t('pages.modules.users.searchPlaceholder'),
        value: search,
        onChange: setSearch,
        sx: {
          width: { xs: '100%', sm: 320 },
        },
      }}
      table={{
        headerRows: [
          [
            {
              id: 'name',
              label: t('pages.modules.users.columns.name'),
              sortKey: 'name',
            },
            {
              id: 'username',
              label: t('pages.modules.users.columns.username'),
              sortKey: 'username',
            },
            {
              id: 'enabled',
              label: t('pages.modules.users.columns.enabled'),
              align: 'center',
              sortKey: 'enabled',
            },
            {
              id: 'actions',
              label: t('pages.modules.users.columns.actions'),
              align: 'right',
            },
          ],
        ],
        columns,
        rows: users,
        getRowId: (user) => user.id,
        loading,
        loadingLabel: t('pages.modules.users.loading'),
        emptyLabel: t('pages.modules.users.empty'),
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
      <UserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        metadata={dialogMetadata}
        submitting={submitting}
        isSelfEdit={isCurrentUser(selectedUser)}
        onClose={handleCloseDialog}
        onSubmit={(values) => {
          void handleSubmitUser(values);
        }}
      />

      <UserDetailsDialog
        open={Boolean(userDetails)}
        user={userDetails}
        editDisabled={submitting || deleting || passwordSubmitting || metadataLoading}
        onClose={() => setUserDetails(null)}
        onEdit={canUpdate ? handleEditUserDetails : undefined}
      />

      <PasswordChangeDialog
        open={Boolean(passwordUser)}
        variant={isCurrentUser(passwordUser) ? 'own' : 'temporary'}
        userName={passwordUser?.name}
        submitting={passwordSubmitting}
        onClose={handleClosePasswordDialog}
        onSubmit={handleSubmitPassword}
      />

      <ConfirmDialog
        open={Boolean(userPendingDelete)}
        title={t('pages.modules.users.dialogs.deleteTitle')}
        message={t('pages.modules.users.dialogs.deleteMessage', {
          name: userPendingDelete?.name ?? '',
        })}
        confirmLabel={t('form.common.delete')}
        cancelLabel={t('form.field.cancel')}
        confirming={deleting}
        confirmColor="error"
        onClose={() => {
          if (deleting) return;
          setUserPendingDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </ModuleSection>
  );
};
