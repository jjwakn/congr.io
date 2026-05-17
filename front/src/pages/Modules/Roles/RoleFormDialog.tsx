import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PermissionAction, PermissionMap } from '@/types/permission.types';
import { PermissionsMatrix } from './PermissionsMatrix';
import { RoleFormDialogProps } from './roles.types';

const togglePermission = (permissions: PermissionMap, sectionId: string, action: PermissionAction): PermissionMap => {
  const nextPermissions = { ...permissions };
  const currentActions = nextPermissions[sectionId] ?? [];
  const nextActions = currentActions.includes(action)
    ? currentActions.filter((value) => value !== action)
    : [...currentActions, action];

  if (nextActions.length) nextPermissions[sectionId] = nextActions;
  else delete nextPermissions[sectionId];

  return nextPermissions;
};

export const RoleFormDialog = ({
  open,
  mode,
  role,
  sections,
  actions,
  submitting,
  onClose,
  onSubmit,
}: RoleFormDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [fullAccess, setFullAccess] = useState(false);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [nameError, setNameError] = useState('');

  const resetState = useCallback(() => {
    setName(role?.name ?? '');
    setFullAccess(Boolean(role?.full_access));
    setPermissions(role?.permissions ?? {});
    setNameError('');
  }, [role]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = () => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setNameError(`${t('form.field.name')} ${t('form.error.isRequired')}`);
      return;
    }

    onSubmit({
      name: normalizedName,
      full_access: fullAccess,
      permissions: fullAccess ? {} : permissions,
    });
  };

  const dialogLabels = useMemo(
    () => ({
      createTitle: t('pages.modules.roles.dialogs.createTitle'),
      editTitle: t('pages.modules.roles.dialogs.editTitle'),
      createSubmit: t('pages.modules.roles.actions.create'),
      editSubmit: t('pages.modules.roles.actions.save'),
      cancel: t('form.field.cancel'),
    }),
    [t],
  );

  return (
    <CreateEditDialog
      open={open}
      mode={mode}
      submitting={submitting}
      onClose={handleClose}
      onSubmit={handleSubmit}
      onEnter={resetState}
      maxWidth="lg"
      labels={dialogLabels}
    >
      <TextField
        autoFocus
        fullWidth
        label={t('form.field.name')}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (nameError) setNameError('');
        }}
        error={Boolean(nameError)}
        helperText={nameError}
        disabled={submitting}
      />

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={fullAccess}
              disabled={submitting}
              onChange={(event) => setFullAccess(event.target.checked)}
            />
          }
          label={t('pages.modules.roles.form.fullAccess')}
        />
        <Typography variant="body2" color="text.secondary">
          {t('pages.modules.roles.form.fullAccessHint')}
        </Typography>
      </Box>

      <PermissionsMatrix
        actions={actions}
        disabled={submitting || fullAccess}
        value={permissions}
        sections={sections}
        onToggle={(sectionId, action) => setPermissions((current) => togglePermission(current, sectionId, action))}
      />
    </CreateEditDialog>
  );
};
