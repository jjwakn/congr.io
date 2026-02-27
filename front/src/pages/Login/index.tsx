import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LogoBig } from '../../components/Logos';
import { LoginCredentials } from '../../contexts/AuthContext.types';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationContext } from '../../hooks/useNotifications';

const Login = () => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const { showNotification } = useNotificationContext();

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
      const message =
        err instanceof Error ? err.message : t('auth.loginFailed');
      showNotification(message, { severity: 'error' });
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

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ mt: 2 }}
          >
            <TextField
              fullWidth
              label={t('form.field.username')}
              type="text"
              margin="normal"
              autoComplete="username"
              error={Boolean(errors.username)}
              helperText={
                errors.username
                  ? `${t('form.field.username')} ${t('form.error.isRequired')}`
                  : undefined
              }
              {...register('username', { required: true })}
            />

            <TextField
              fullWidth
              label={t('form.field.password')}
              type="password"
              margin="normal"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={
                errors.password
                  ? `${t('form.field.password')} ${t('form.error.isRequired')}`
                  : undefined
              }
              {...register('password', { required: true })}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ mt: 3 }}
            >
              {isLoading ? <CircularProgress size={24} /> : t('auth.signIn')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
