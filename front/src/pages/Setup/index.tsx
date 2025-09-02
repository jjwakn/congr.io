import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FormContainer } from '../../components/common/FormContainer';
import { useAppContext } from '../../hooks/useAppContext';
import { useNotificationContext } from '../../hooks/useNotifications';
import { Congregation } from '../../types/congregation.types';
import { COMMON_DEFAULT_VALUES } from '../../utils/constants';

const Setup = () => {
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const { refreshIsSetup } = useAppContext();
  const { showNotification } = useNotificationContext();

  const filter = createFilterOptions<string>();

  const form = useForm<Congregation>({
    defaultValues: {
      ...COMMON_DEFAULT_VALUES,
      name: '',
      type: t('setup.form.defaultType'),
    },
  });
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = form;

  const type = watch('type');

  const onSubmit = async (data: Congregation) => {
    try {
      setLoading(true);
      console.log({ data });
      // delay 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await refreshIsSetup();
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      showNotification(error, { severity: 'error' });

      console.error('Setup Error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer<Congregation>
      form={form}
      onSubmit={onSubmit}
      title={t('setup.form.title')}
      subtitle={`${t('setup.form.subtitle')} ${type}`}
      disabled={loading}
      submitText={`${t('setup.form.submitText')} ${type}`}
      loading={loading}
      loadingTooltip={`${t('setup.form.tooltip')} ${type}`}
    >
      <TextField
        fullWidth
        label={errors?.name?.message ?? `${type} ${t('form.field.name')}`}
        margin="normal"
        {...register('name', {
          required: `${type} ${t('form.field.name')} ${t('form.error.isRequired')}`,
        })}
        error={!!errors?.name}
      />

      <Controller
        name="type"
        control={control}
        rules={{
          required: `${t('form.field.type')} ${t('form.error.isRequired')}`,
        }}
        render={({ field }) => (
          <Autocomplete
            {...field}
            disableClearable
            clearIcon={null}
            onChange={(_event, newValue) => field.onChange(newValue)}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);
              const { inputValue } = params;
              const isExisting = options.some(
                (option) => inputValue.toLowerCase() === option.toLowerCase(),
              );
              if (inputValue !== '' && !isExisting)
                filtered.push(`${t('form.field.add')} "${inputValue}"`);

              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={t('setup.form.types').split(',')}
            renderOption={({ key, ...optionProps }, option) => (
              <li key={key} {...optionProps}>
                {option}
              </li>
            )}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label={errors?.type?.message ?? t('form.field.type')}
                margin="normal"
                error={!!errors?.type}
              />
            )}
          />
        )}
      />
    </FormContainer>
  );
};

export default Setup;
