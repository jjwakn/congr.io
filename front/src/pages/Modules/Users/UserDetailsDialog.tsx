import { ViewDialog } from '@components/common/forms/ViewDialog';
import { Box, FormControlLabel, Switch, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { UserRelationSummary } from './UserRelationSummary';
import type { UserDetailsDialogProps } from './users.types';

const getNames = <Entity extends { name: string }>(values?: Entity[]) => values?.map((value) => value.name) ?? [];

export const UserDetailsDialog = ({ open, user, onClose }: UserDetailsDialogProps) => {
  const { t } = useTranslation();

  return (
    <ViewDialog
      open={open}
      title={t('pages.modules.users.dialogs.viewTitle')}
      closeLabel={t('form.field.close')}
      onClose={onClose}
      maxWidth="md"
    >
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <TextField fullWidth label={t('form.field.username')} value={user?.username ?? ''} disabled />
          <TextField fullWidth label={t('form.field.name')} value={user?.name ?? ''} disabled />
        </Box>

        <FormControlLabel
          control={<Switch checked={Boolean(user?.enabled)} disabled />}
          label={t('pages.modules.users.form.enabled')}
        />

        <UserRelationSummary
          label={t('pages.modules.users.form.roles')}
          values={getNames(user?.roles)}
          emptyText={t('pages.modules.users.form.noRoles')}
        />

        <UserRelationSummary
          label={t('pages.modules.users.form.congregations')}
          values={getNames(user?.congregations)}
          emptyText={t('pages.modules.users.form.noCongregations')}
        />

        <UserRelationSummary
          label={t('pages.modules.users.form.locations')}
          values={getNames(user?.locations)}
          emptyText={t('pages.modules.users.form.noLocations')}
        />
      </Box>
    </ViewDialog>
  );
};
