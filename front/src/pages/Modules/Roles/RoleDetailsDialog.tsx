import { ViewDialog } from '@components/common/forms/ViewDialog';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, FormControlLabel, IconButton, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PermissionsMatrix } from './PermissionsMatrix';
import { RoleDetailsDialogProps } from './roles.types';

export const RoleDetailsDialog = ({
  open,
  role,
  sections,
  actions,
  editDisabled,
  onClose,
  onEdit,
}: RoleDetailsDialogProps) => {
  const { t } = useTranslation();
  const editLabel = t('pages.modules.roles.actions.edit');

  return (
    <ViewDialog
      open={open}
      title={t('pages.modules.roles.dialogs.viewTitle')}
      closeLabel={t('form.field.close')}
      onClose={onClose}
      maxWidth="lg"
      titleAction={
        role && onEdit ? (
          <Tooltip title={editLabel}>
            <span>
              <IconButton aria-label={editLabel} color="secondary" disabled={editDisabled} onClick={onEdit}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : undefined
      }
    >
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <TextField fullWidth label={t('form.field.name')} value={role?.name ?? ''} disabled />

        <Box>
          <FormControlLabel
            control={<Switch checked={Boolean(role?.full_access)} disabled />}
            label={t('pages.modules.roles.form.fullAccess')}
          />
          <Typography variant="body2" color="text.secondary">
            {t('pages.modules.roles.form.fullAccessHint')}
          </Typography>
        </Box>

        {!role?.full_access ? (
          <PermissionsMatrix
            actions={actions}
            disabled
            value={role?.permissions ?? {}}
            sections={sections}
            onToggle={() => undefined}
          />
        ) : null}
      </Box>
    </ViewDialog>
  );
};
