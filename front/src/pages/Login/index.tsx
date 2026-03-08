import { LogoBig } from '@components/Logos';
import { LoginCredentials } from '@contexts/AuthContext.types';
import { useAuth } from '@hooks/useAuth';
import { useNotificationContext } from '@hooks/useNotifications';
import { Box, Button, Card, CardContent, CircularProgress, TextField } from '@mui/material';
import { type KeyboardEvent, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const { showNotification } = useNotificationContext();
  const formRef = useRef<HTMLFormElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginCredentials) => {
    try {
      await login(values);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.loginFailed');
      showNotification(message, { severity: 'error' });
    }
  };

  const handleUsernameKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

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
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ padding: 3 }}>
          <LogoBig
            alt={t('auth.logoAlt')}
            size={160}
            containerSx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
            imageSx={{
              maxWidth: '100%',
            }}
          />

          <Box component="form" ref={formRef} onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('form.field.username')}
              type="text"
              margin="normal"
              autoComplete="username"
              error={Boolean(errors.username)}
              onKeyDown={handleUsernameKeyDown}
              helperText={errors.username ? `${t('form.field.username')} ${t('form.error.isRequired')}` : undefined}
              {...register('username', { required: true })}
            />

            <TextField
              fullWidth
              label={t('form.field.password')}
              type="password"
              margin="normal"
              autoComplete="current-password"
              inputRef={passwordInputRef}
              error={Boolean(errors.password)}
              onKeyDown={handlePasswordKeyDown}
              helperText={errors.password ? `${t('form.field.password')} ${t('form.error.isRequired')}` : undefined}
              {...register('password', { required: true })}
            />

            <Button type="submit" fullWidth variant="contained" disabled={isLoading} sx={{ mt: 3 }}>
              {isLoading ? <CircularProgress size={24} /> : t('auth.signIn')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
