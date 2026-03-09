import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Typography } from '@mui/material';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSetup } from '../../../hooks/useSetup';
import { SetupData } from '../../../types/setup.types';
import { FormContainer } from '../../common/FormContainer';

export const FeaturesStep = ({
  goNext,
  goBack,
  loading,
}: {
  goNext: () => void;
  goBack: () => void;
  loading?: boolean;
}) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const { t } = useTranslation();
  const { setupData, setSetupData, features } = useSetup();
  const form = useForm<SetupData['features']>({
    defaultValues: {
      features:
        setupData.features.features.length > 0
          ? setupData.features.features
          : features.filter((f) => f.required).map((f) => f.id),
    },
  });
  const selectedFeatures = useWatch({
    control: form.control,
    name: 'features',
  });

  const { setValue } = form;

  useEffect(() => {
    if (!features.length) return;

    const current = form.getValues('features') ?? [];
    if (current.length > 0) return;

    setValue(
      'features',
      features.filter((feature) => feature.required).map((feature) => feature.id),
    );
  }, [features, form, setValue]);

  const handleNext = useCallback(
    (values: SetupData['features']) => {
      setSetupData((prev) => ({ ...prev, features: values }));
      goNext();
    },
    [goNext, setSetupData],
  );

  const handleChange = useCallback(
    (panel: string) => (_: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    [],
  );

  const handleSelectAll = useCallback(() => {
    const allSelected = selectedFeatures.length === features.length;
    if (allSelected)
      setValue(
        'features',
        features.filter((f) => f.required).map((f) => f.id),
      );
    else
      setValue(
        'features',
        features.map((f) => f.id),
      );
  }, [features, selectedFeatures.length, setValue]);

  return (
    <FormContainer<SetupData['features']>
      form={form}
      onSubmit={handleNext}
      title={t('setup.form.features')}
      subtitle={t('setup.form.featuresText')}
      submitText={t('form.field.next')}
      loading={loading}
      onCancel={goBack}
      cancelText={t('form.field.back')}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          width: '100%',
          maxHeight: '45svh',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 1.5,
            ':hover': {
              cursor: 'pointer',
            },
          }}
          onClick={handleSelectAll}
        >
          <Checkbox checked={selectedFeatures.length === features.length} />

          <Typography fontWeight="bold">{t('form.field.selectAll')}</Typography>
        </Box>

        {features.map((f) => (
          <Box key={f.id}>
            <Controller
              name="features"
              control={form.control}
              render={({ field }) => {
                const selected = new Set(field.value ?? []);
                const checked = selected.has(f.id);

                return (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(field.value ?? []);
                        if (e.target.checked) {
                          next.add(f.id);

                          if (f.prerequisites?.length)
                            f.prerequisites.forEach((p) => {
                              if (!next.has(p)) next.add(p);
                            });
                        } else {
                          next.delete(f.id);
                          const prerequisiteOf = features.filter((feature) => feature.prerequisites?.includes(f.id));
                          prerequisiteOf.forEach((feature) => {
                            if (next.has(feature.id)) next.delete(feature.id);
                          });
                        }

                        field.onChange(Array.from(next));
                      }}
                      disabled={f.required}
                      sx={{ mt: '2px' }}
                    />

                    <Accordion expanded={expanded === f.id} onChange={handleChange(f.id)}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography component="span">{f.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography
                          sx={{
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {f.description.replace('{type}', setupData.congregation.type)}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                );
              }}
            />
          </Box>
        ))}
      </Box>
    </FormContainer>
  );
};

export default FeaturesStep;
