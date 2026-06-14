import { FormContainer } from '@components/common/FormContainer';
import { useSetup } from '@hooks/useSetup';
import { Autocomplete, Box, TextField, createFilterOptions } from '@mui/material';
import { getSupportedTimeZones } from '@utils/datetime';
import { useCallback, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SetupData } from '@/types/setup.types';
import { TimezoneStepProps } from './TimezoneStep.types';

export const TimezoneStep = ({ goNext, goBack, loading }: TimezoneStepProps) => {
  const { t } = useTranslation();
  const { setupData, setSetupData } = useSetup();
  const filter = createFilterOptions<string>();
  const timeZones = useMemo(() => getSupportedTimeZones(), []);

  const form = useForm<Pick<SetupData['congregation'], 'timezone'>>({
    defaultValues: {
      timezone: setupData.congregation.timezone,
    },
  });

  const handleNext = useCallback(
    ({ timezone }: Pick<SetupData['congregation'], 'timezone'>) => {
      setSetupData((prev) => ({
        ...prev,
        congregation: {
          ...prev.congregation,
          timezone: timezone.trim(),
        },
      }));
      goNext();
    },
    [goNext, setSetupData],
  );

  return (
    <FormContainer<Pick<SetupData['congregation'], 'timezone'>>
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.timezoneStep')}
      subtitle={t('setup.form.timezoneSubtitle')}
      submitText={t('form.field.next')}
      loading={loading}
      onCancel={goBack}
      cancelText={t('form.field.back')}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        <Controller
          name="timezone"
          control={form.control}
          rules={{
            required: `${t('form.field.timezone')} ${t('form.error.isRequired')}`,
          }}
          render={({ field }) => (
            <Autocomplete
              {...field}
              disableClearable
              freeSolo
              inputValue={field.value ?? ''}
              onInputChange={(_event, newValue) => field.onChange(newValue)}
              onChange={(_event, newValue) => field.onChange(newValue)}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue.toLowerCase() === option.toLowerCase());
                if (inputValue !== '' && !isExisting) filtered.push(inputValue);
                return filtered;
              }}
              options={timeZones}
              renderOption={({ key, ...optionProps }, option) => (
                <li key={key} {...optionProps}>
                  {option}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={t('form.field.timezone')}
                  error={!!form.formState.errors.timezone}
                  helperText={form.formState.errors.timezone?.message ?? t('setup.form.timezoneText')}
                />
              )}
            />
          )}
        />
      </Box>
    </FormContainer>
  );
};

export default TimezoneStep;
