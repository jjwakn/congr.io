import { CreateEditDialog } from '@components/common/forms/CreateEditDialog';
import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PermissionAction, PermissionMap } from '@/types/permission.types';
import { PermissionsMatrix } from './PermissionsMatrix';
import { RoleFormDialogProps } from './roles.types';

const REQUIRED_PERMISSION_ACTIONS: Partial<Record<PermissionAction, PermissionAction[]>> = {
  create: ['get'],
  update: ['get'],
  delete: ['update', 'get'],
  change_password: ['get'],
  lock: ['get'],
};

const getRequiredActions = (action: PermissionAction, supportedActions: PermissionAction[]) => {
  const requiredActions = new Set<PermissionAction>();

  const visitAction = (currentAction: PermissionAction) => {
    (REQUIRED_PERMISSION_ACTIONS[currentAction] ?? []).forEach((requiredAction) => {
      if (!supportedActions.includes(requiredAction) || requiredActions.has(requiredAction)) return;

      requiredActions.add(requiredAction);
      visitAction(requiredAction);
    });
  };

  visitAction(action);

  return supportedActions.filter((supportedAction) => requiredActions.has(supportedAction));
};

const getDependentActions = (action: PermissionAction, supportedActions: PermissionAction[]) =>
  supportedActions.filter(
    (supportedAction) =>
      supportedAction !== action && getRequiredActions(supportedAction, supportedActions).includes(action),
  );

const normalizeSectionActions = (actions: PermissionAction[], supportedActions: PermissionAction[]) => {
  const normalizedActions = new Set(actions.filter((action) => supportedActions.includes(action)));

  normalizedActions.forEach((action) => {
    getRequiredActions(action, supportedActions).forEach((requiredAction) => normalizedActions.add(requiredAction));
  });

  return supportedActions.filter((action) => normalizedActions.has(action));
};

const normalizePermissions = (permissions: PermissionMap, sections: RoleFormDialogProps['sections']): PermissionMap => {
  const normalized = sections.reduce<PermissionMap>((normalizedPermissions, section) => {
    const normalizedActions = normalizeSectionActions(permissions[section.id] ?? [], section.permissions);

    if (normalizedActions.length) normalizedPermissions[section.id] = normalizedActions;

    return normalizedPermissions;
  }, {});
  const needsEventAndPerson = Boolean(normalized.event_attendance?.length || normalized.event_registration?.length);
  if (needsEventAndPerson) {
    normalized.event = normalizeSectionActions(
      [...(normalized.event ?? []), 'get'],
      sections.find(({ id }) => id === 'event')?.permissions ?? [],
    );
    normalized.person = normalizeSectionActions(
      [...(normalized.person ?? []), 'get'],
      sections.find(({ id }) => id === 'person')?.permissions ?? [],
    );
  }
  return normalized;
};

const togglePermission = (
  permissions: PermissionMap,
  sectionId: string,
  action: PermissionAction,
  supportedActions: PermissionAction[],
): PermissionMap => {
  const nextPermissions = { ...permissions };
  const currentActions = new Set(nextPermissions[sectionId]?.filter((value) => supportedActions.includes(value)) ?? []);

  if (currentActions.has(action)) {
    currentActions.delete(action);
    getDependentActions(action, supportedActions).forEach((dependentAction) => currentActions.delete(dependentAction));
  } else {
    currentActions.add(action);
    getRequiredActions(action, supportedActions).forEach((requiredAction) => currentActions.add(requiredAction));
  }

  const nextActions = supportedActions.filter((value) => currentActions.has(value));

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
    setPermissions(normalizePermissions(role?.permissions ?? {}, sections));
    setNameError('');
  }, [role, sections]);

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
      permissions: fullAccess ? {} : normalizePermissions(permissions, sections),
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
        onToggle={(sectionId, action) => {
          const section = sections.find(({ id }) => id === sectionId);
          if (!section) return;

          setPermissions((current) => {
            const next = togglePermission(current, sectionId, action, section.permissions);
            if (
              (sectionId === 'event' || sectionId === 'person') &&
              action === 'get' &&
              !next[sectionId]?.includes('get')
            ) {
              delete next.event_attendance;
              delete next.event_registration;
            }
            return normalizePermissions(next, sections);
          });
        }}
      />
    </CreateEditDialog>
  );
};
