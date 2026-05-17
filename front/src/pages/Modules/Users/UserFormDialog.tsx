import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRelationSelect } from './UserRelationSelect';
import type { UserFormDialogProps, UserRelationOption } from './users.types';

const mapOptions = <Entity extends { id: string; name: string }>(values: Entity[]): UserRelationOption[] =>
  values.map((value) => ({
    id: value.id,
    label: value.name,
  }));

const getRelationIds = <Entity extends { id: string }>(values?: Entity[]) => values?.map((value) => value.id) ?? [];

export const UserFormDialog = ({ open, mode, user, metadata, submitting, onClose, onSubmit }: UserFormDialogProps) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [congregationIds, setCongregationIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const roleOptions = useMemo(() => mapOptions(metadata.roles), [metadata.roles]);
  const congregationOptions = useMemo(() => mapOptions(metadata.congregations), [metadata.congregations]);
  const locationOptions = useMemo(() => mapOptions(metadata.locations), [metadata.locations]);

  const resetState = useCallback(() => {
    setUsername(user?.username ?? '');
    setPassword('');
    setName(user?.name ?? '');
    setEnabled(user?.enabled ?? true);
    setRoleIds(getRelationIds(user?.roles));
    setCongregationIds(user ? getRelationIds(user.congregations) : metadata.congregations.map((value) => value.id));
    setLocationIds(user ? getRelationIds(user.locations) : metadata.locations.map((value) => value.id));
    setUsernameError('');
    setPasswordError('');
    setNameError('');
  }, [metadata.congregations, metadata.locations, user]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = () => {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();
    const normalizedName = name.trim();
    let hasError = false;

    if (!normalizedUsername) {
      setUsernameError(`${t('form.field.username')} ${t('form.error.isRequired')}`);
      hasError = true;
    }

    if (mode === 'create' && !normalizedPassword) {
      setPasswordError(`${t('form.field.password')} ${t('form.error.isRequired')}`);
      hasError = true;
    }

    if (!normalizedName) {
      setNameError(`${t('form.field.name')} ${t('form.error.isRequired')}`);
      hasError = true;
    }

    if (hasError) return;

    onSubmit({
      username: normalizedUsername,
      ...(normalizedPassword ? { password: normalizedPassword } : {}),
      name: normalizedName,
      enabled,
      roles_ids: roleIds,
      congregations_ids: congregationIds,
      locations_ids: locationIds,
    });
  };

  const dialogLabels = useMemo(
    () => ({
      createTitle: t('pages.modules.users.dialogs.createTitle'),
      editTitle: t('pages.modules.users.dialogs.editTitle'),
      createSubmit: t('pages.modules.users.actions.create'),
      editSubmit: t('pages.modules.users.actions.save'),
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
      maxWidth="md"
      labels={dialogLabels}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <TextField
          autoFocus
          fullWidth
          label={t('form.field.username')}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            if (usernameError) setUsernameError('');
          }}
          error={Boolean(usernameError)}
          helperText={usernameError}
          disabled={submitting}
        />

        <TextField
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

        <TextField
          fullWidth
          type="password"
          label={t('form.field.password')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError('');
          }}
          error={Boolean(passwordError)}
          helperText={passwordError || (mode === 'edit' ? t('pages.modules.users.form.passwordHint') : undefined)}
          disabled={submitting}
        />

        <Box>
          <FormControlLabel
            control={
              <Switch checked={enabled} disabled={submitting} onChange={(event) => setEnabled(event.target.checked)} />
            }
            label={t('pages.modules.users.form.enabled')}
          />
          <Typography variant="body2" color="text.secondary">
            {t('pages.modules.users.form.enabledHint')}
          </Typography>
        </Box>
      </Box>

      <UserRelationSelect
        label={t('pages.modules.users.form.roles')}
        options={roleOptions}
        value={roleIds}
        disabled={submitting}
        emptyText={t('pages.modules.users.form.noRoles')}
        onChange={setRoleIds}
      />

      <UserRelationSelect
        label={t('pages.modules.users.form.congregations')}
        options={congregationOptions}
        value={congregationIds}
        disabled={submitting}
        emptyText={t('pages.modules.users.form.noCongregations')}
        onChange={setCongregationIds}
      />

      <UserRelationSelect
        label={t('pages.modules.users.form.locations')}
        options={locationOptions}
        value={locationIds}
        disabled={submitting}
        emptyText={t('pages.modules.users.form.noLocations')}
        helperText={t('pages.modules.users.form.locationsHint')}
        onChange={setLocationIds}
      />
    </CreateEditDialog>
  );
};
