import { LogoBig } from '@components/Logos';
import { Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material';
import { type FormEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PasswordChangeFieldErrors } from './PasswordChangeDialog.types';
import type { RequiredPasswordChangeProps } from './RequiredPasswordChange.types';

export const RequiredPasswordChange = ({ submitting, onSubmit }: RequiredPasswordChangeProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<PasswordChangeFieldErrors>({});

  const validate = useCallback(() => {
    const nextErrors: PasswordChangeFieldErrors = {};
    const normalizedPassword = password.trim();
    const normalizedPasswordConfirmation = passwordConfirmation.trim();

    if (!normalizedPassword) {
      nextErrors.password = `${t('form.field.newPassword')} ${t('form.error.isRequired')}`;
    }

    if (!normalizedPasswordConfirmation) {
      nextErrors.password_confirmation = `${t('form.field.confirmPassword')} ${t('form.error.isRequired')}`;
    } else if (normalizedPassword && normalizedPassword !== normalizedPasswordConfirmation) {
      nextErrors.password_confirmation = t('pages.modules.users.error.passwordsDoNotMatch');
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length
      ? null
      : {
          password: normalizedPassword,
          password_confirmation: normalizedPasswordConfirmation,
        };
  }, [password, passwordConfirmation, t]);

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 560, width: '100%' }}>
        <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
          <LogoBig
            alt={t('auth.logoAlt')}
            size={136}
            containerSx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
            imageSx={{
              maxWidth: '100%',
            }}
          />

          <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            {t('pages.modules.users.dialogs.requiredPasswordTitle')}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              margin="normal"
              type="password"
              autoComplete="new-password"
              label={t('form.field.newPassword')}
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
              label={t('form.field.confirmPassword')}
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

            <Button type="submit" fullWidth variant="contained" disabled={submitting} sx={{ mt: 3 }}>
              {submitting ? <CircularProgress size={24} /> : t('pages.modules.users.actions.savePassword')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
