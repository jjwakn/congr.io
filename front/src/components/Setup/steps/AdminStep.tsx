import { FormContainer } from '@components/common/FormContainer';
import { useSetup } from '@hooks/useSetup';
import { Box, TextField } from '@mui/material';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SetupData } from '@/types/setup.types';

export const AdminStep = ({
  goNext,
  goBack,
  loading,
}: {
  goNext: () => void;
  goBack: () => void;
  loading?: boolean;
}) => {
  const { t } = useTranslation();
  const { setupData, setSetupData } = useSetup();
  const form = useForm<SetupData['admin']>({
    defaultValues: setupData.admin,
  });

  const handleNext = useCallback(
    (values: SetupData['admin']) => {
      setSetupData((prev) => ({
        ...prev,
        admin: {
          username: values.username.trim(),
          password: values.password,
          name: values.name.trim(),
          roleName: values.roleName.trim(),
          bootstrapSecret: values.bootstrapSecret,
        },
      }));
      goNext();
    },
    [goNext, setSetupData],
  );

  return (
    <FormContainer<SetupData['admin']>
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.user')}
      subtitle={t('setup.form.userSubtitle')}
      submitText={t('form.field.next')}
      loading={loading}
      onCancel={goBack}
      cancelText={t('form.field.back')}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <TextField
          fullWidth
          label={t('form.field.username')}
          {...form.register('username', {
            required: t('form.error.isRequired') as string,
          })}
          error={!!form.formState.errors.username}
          helperText={form.formState.errors.username?.message}
        />
        <TextField
          fullWidth
          type="password"
          label={t('form.field.password')}
          {...form.register('password', {
            required: t('form.error.isRequired') as string,
          })}
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
        />
        <TextField
          fullWidth
          label={t('form.field.name')}
          {...form.register('name', {
            required: t('form.error.isRequired') as string,
          })}
          error={!!form.formState.errors.name}
          helperText={form.formState.errors.name?.message}
        />
        <TextField
          fullWidth
          label={t('setup.form.fullAccessRoleName')}
          {...form.register('roleName', {
            required: t('form.error.isRequired') as string,
          })}
          error={!!form.formState.errors.roleName}
          helperText={form.formState.errors.roleName?.message}
        />
        <TextField
          fullWidth
          type="password"
          label={t('setup.form.bootstrapSecret')}
          {...form.register('bootstrapSecret', {
            required: t('form.error.isRequired') as string,
            minLength: { value: 32, message: t('setup.error.bootstrapSecretLength') },
          })}
          error={!!form.formState.errors.bootstrapSecret}
          helperText={form.formState.errors.bootstrapSecret?.message ?? t('setup.form.bootstrapSecretHelp')}
        />
      </Box>
    </FormContainer>
  );
};

export default AdminStep;
