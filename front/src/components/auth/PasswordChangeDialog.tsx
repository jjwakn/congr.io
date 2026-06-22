import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { type FormEvent, useCallback, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PasswordChangeDialogProps, PasswordChangeFieldErrors } from './PasswordChangeDialog.types';

export const PasswordChangeDialog = ({
  open,
  variant,
  submitting,
  userName,
  onClose,
  onSubmit,
}: PasswordChangeDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const formId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<PasswordChangeFieldErrors>({});
  const requiresCurrentPassword = variant !== 'temporary';
  const canClose = Boolean(onClose);

  const handleEnter = useCallback(() => {
    setCurrentPassword('');
    setPassword('');
    setPasswordConfirmation('');
    setErrors({});
  }, []);

  const title = useMemo(() => {
    if (variant === 'temporary') {
      return t('pages.modules.users.dialogs.setTemporaryPasswordTitle', {
        name: userName ?? '',
      });
    }

    if (variant === 'required') return t('pages.modules.users.dialogs.requiredPasswordTitle');

    return t('pages.modules.users.dialogs.changeOwnPasswordTitle');
  }, [t, userName, variant]);

  const submitLabel = useMemo(
    () =>
      variant === 'temporary'
        ? t('pages.modules.users.actions.setTemporaryPassword')
        : t('pages.modules.users.actions.savePassword'),
    [t, variant],
  );

  const validate = useCallback(() => {
    const nextErrors: PasswordChangeFieldErrors = {};
    const normalizedCurrentPassword = currentPassword.trim();
    const normalizedPassword = password.trim();
    const normalizedPasswordConfirmation = passwordConfirmation.trim();

    if (requiresCurrentPassword && !normalizedCurrentPassword) {
      nextErrors.current_password = `${t('form.field.currentPassword')} ${t('form.error.isRequired')}`;
    }

    if (!normalizedPassword) {
      nextErrors.password = `${t(
        variant === 'temporary' ? 'form.field.temporaryPassword' : 'form.field.newPassword',
      )} ${t('form.error.isRequired')}`;
    } else if (requiresCurrentPassword && normalizedCurrentPassword === normalizedPassword) {
      nextErrors.password = t('pages.modules.users.error.newPasswordMustBeDifferent');
    }

    if (!normalizedPasswordConfirmation) {
      nextErrors.password_confirmation = `${t(
        variant === 'temporary' ? 'form.field.confirmTemporaryPassword' : 'form.field.confirmPassword',
      )} ${t('form.error.isRequired')}`;
    } else if (normalizedPassword && normalizedPassword !== normalizedPasswordConfirmation) {
      nextErrors.password_confirmation = t('pages.modules.users.error.passwordsDoNotMatch');
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length
      ? null
      : {
          ...(requiresCurrentPassword ? { current_password: normalizedCurrentPassword } : {}),
          password: normalizedPassword,
          password_confirmation: normalizedPasswordConfirmation,
        };
  }, [currentPassword, password, passwordConfirmation, requiresCurrentPassword, t, variant]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const values = validate();
      if (!values) return;

      onSubmit(values);
    },
    [onSubmit, submitting, validate],
  );

  return (
    <Dialog
      open={open}
      fullWidth
      fullScreen={isMobile}
      maxWidth="sm"
      onClose={submitting || !onClose ? undefined : onClose}
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box component="span" sx={{ minWidth: 0 }}>
          {title}
        </Box>
        {canClose ? (
          <Tooltip title={t('form.field.close')}>
            <IconButton onClick={onClose} disabled={submitting} aria-label={t('form.field.close')} edge="end">
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </DialogTitle>

      <DialogContent>
        <form id={formId} onSubmit={handleSubmit}>
          {requiresCurrentPassword ? (
            <TextField
              autoFocus
              fullWidth
              margin="normal"
              type="password"
              autoComplete="current-password"
              label={t('form.field.currentPassword')}
              value={currentPassword}
              error={Boolean(errors.current_password)}
              helperText={errors.current_password}
              disabled={submitting}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                if (errors.current_password) setErrors((currentErrors) => ({ ...currentErrors, current_password: '' }));
              }}
            />
          ) : null}

          <TextField
            autoFocus={!requiresCurrentPassword}
            fullWidth
            margin="normal"
            type="password"
            autoComplete="new-password"
            label={t(variant === 'temporary' ? 'form.field.temporaryPassword' : 'form.field.newPassword')}
            value={password}
            error={Boolean(errors.password)}
            helperText={errors.password}
            disabled={submitting}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) setErrors((currentErrors) => ({ ...currentErrors, password: '' }));
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            type="password"
            autoComplete="new-password"
            label={t(variant === 'temporary' ? 'form.field.confirmTemporaryPassword' : 'form.field.confirmPassword')}
            value={passwordConfirmation}
            error={Boolean(errors.password_confirmation)}
            helperText={errors.password_confirmation}
            disabled={submitting}
            onChange={(event) => {
              setPasswordConfirmation(event.target.value);
              if (errors.password_confirmation)
                setErrors((currentErrors) => ({ ...currentErrors, password_confirmation: '' }));
            }}
          />
        </form>
      </DialogContent>

      <DialogActions>
        {canClose ? (
          <Button onClick={onClose} disabled={submitting}>
            {t('form.field.cancel')}
          </Button>
        ) : null}
        <Button type="submit" form={formId} variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
