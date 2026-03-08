import { Autocomplete, Box, TextField, createFilterOptions } from '@mui/material';
import { useCallback } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetup } from '../../../hooks/useSetup';
import { SetupData } from '../../../types/setup.types';
import { FormContainer } from '../../common/FormContainer';

export const CongregationStep = ({ goNext, loading }: { goNext: () => void; loading?: boolean }) => {
  const { t } = useTranslation();
  const { setupData, setSetupData } = useSetup();
  const form = useForm<SetupData['congregation']>({
    defaultValues: {
      name: setupData['congregation'].name,
      type: setupData['congregation'].type || t('setup.form.defaultType'),
    },
  });
  const filter = createFilterOptions<string>();

  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const handleNext = useCallback(
    (values: SetupData['congregation']) => {
      setSetupData((prev) => ({ ...prev, congregation: values }));
      goNext();
    },
    [goNext, setSetupData],
  );

  return (
    <FormContainer<SetupData['congregation']>
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.title')}
      subtitle={t('setup.form.subtitle', { type })}
      submitText={t('form.field.next')}
      loading={loading}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        <TextField
          fullWidth
          label={t('form.field.name')}
          {...form.register('name', {
            required: `${t('form.field.name')} ${t('form.error.isRequired')}`,
          })}
          error={!!form.formState.errors.name}
          helperText={form.formState.errors.name?.message}
        />

        <Controller
          name="type"
          control={form.control}
          rules={{
            required: `${t('form.field.type')} ${t('form.error.isRequired')}`,
          }}
          render={({ field }) => (
            <Autocomplete
              {...field}
              disableClearable
              clearIcon={null}
              freeSolo
              onChange={(_e, newValue) => field.onChange(newValue)}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue.toLowerCase() === option.toLowerCase());
                if (inputValue !== '' && !isExisting) filtered.push(inputValue);
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={t('form.field.type')}
                  error={!!form.formState.errors.type}
                  helperText={form.formState.errors.type?.message}
                />
              )}
            />
          )}
        />
      </Box>
    </FormContainer>
  );
};

export default CongregationStep;
