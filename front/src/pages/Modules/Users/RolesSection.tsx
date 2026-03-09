import { CrudPermissionStatus } from '@components/common/modules/CrudPermissionStatus';
import { ModuleListActions } from '@components/common/modules/ModuleListActions';
import { ModuleListTable } from '@components/common/modules/ModuleListTable';
import type { ModuleListColumn } from '@components/common/modules/ModuleListTable.types';
import { Alert, Box, TextField, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role } from '@/types/role.types';
import type { CrudAction } from './RolesSection.types';
import { useRolesList } from './useRolesList';

const hasRolePermission = (role: Role, action: CrudAction): boolean => {
  if (role.full_access) return true;
  const rolePermissions = role.permissions?.role ?? [];
  return rolePermissions.includes(action);
};

export const RolesSection = () => {
  const { t } = useTranslation();
  const {
    roles,
    total,
    loading,
    error,
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
  } = useRolesList();

  const columns = useMemo<ModuleListColumn<Role>[]>(
    () => [
      {
        id: 'name',
        label: t('pages.modules.roles.columns.role'),
        sortKey: 'name',
        render: (role) => role.name,
      },
      {
        id: 'full-access',
        label: t('pages.modules.roles.columns.fullAccess'),
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={Boolean(role.full_access)} />,
      },
      {
        id: 'get',
        label: t('pages.modules.roles.columns.get'),
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={hasRolePermission(role, 'get')} />,
      },
      {
        id: 'create',
        label: t('pages.modules.roles.columns.create'),
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={hasRolePermission(role, 'create')} />,
      },
      {
        id: 'update',
        label: t('pages.modules.roles.columns.update'),
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={hasRolePermission(role, 'update')} />,
      },
      {
        id: 'delete',
        label: t('pages.modules.roles.columns.delete'),
        align: 'center',
        render: (role) => <CrudPermissionStatus enabled={hasRolePermission(role, 'delete')} />,
      },
    ],
    [t],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="h6">{t('pages.modules.roles.title')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('pages.modules.roles.description')}
      </Typography>

      <ModuleListActions
        refreshLabel={t('pages.modules.common.refresh')}
        isRefreshing={loading}
        onRefresh={() => {
          void refresh();
        }}
      >
        <TextField
          size="small"
          label={t('pages.modules.common.search')}
          placeholder={t('pages.modules.common.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{
            width: { xs: '100%', sm: 320 },
          }}
        />
      </ModuleListActions>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <ModuleListTable
        columns={columns}
        rows={roles}
        getRowId={(role) => role.id}
        loading={loading}
        loadingLabel={t('pages.modules.common.loading')}
        emptyLabel={t('pages.modules.common.empty')}
        sort={sort}
        direction={direction}
        onSort={handleSort}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handleChangePage}
        onPageSizeChange={handleChangeRowsPerPage}
        rowsPerPageLabel={t('pages.modules.common.rowsPerPage')}
      />
    </Box>
  );
};
