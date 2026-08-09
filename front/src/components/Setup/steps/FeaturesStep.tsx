import { FormContainer } from '@components/common/FormContainer';
import { useSetup } from '@hooks/useSetup';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Switch, Typography } from '@mui/material';
import {
  PARTIAL_FEATURE_SWITCH_SX,
  getFeatureChildren,
  getRootFeatures,
  isFeaturePartiallySelected,
  normalizeSelectedFeatures,
  toggleFeatureSelection,
} from '@utils/features';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SetupData } from '@/types/setup.types';

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
  const normalizedSelectedFeatures = normalizeSelectedFeatures(features, selectedFeatures ?? []);

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
    const allSelected = normalizedSelectedFeatures.length === features.length;
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
  }, [features, normalizedSelectedFeatures.length, setValue]);

  const renderFeature = (feature: (typeof features)[number], depth = 0) => {
    const checked = normalizedSelectedFeatures.includes(feature.id);
    const partial = isFeaturePartiallySelected(features, normalizedSelectedFeatures, feature.id);
    const children = getFeatureChildren(features, feature.id);

    return (
      <Box key={feature.id} sx={{ ml: depth ? 4 : 0 }}>
        <Controller
          name="features"
          control={form.control}
          render={({ field }) => (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              <Switch
                checked={checked}
                onChange={(e) =>
                  field.onChange(
                    toggleFeatureSelection({
                      features,
                      selected: normalizedSelectedFeatures,
                      featureId: feature.id,
                      checked: e.target.checked,
                    }),
                  )
                }
                disabled={feature.required}
                sx={{ mt: '2px', ...(partial ? PARTIAL_FEATURE_SWITCH_SX : {}) }}
              />

              <Accordion expanded={expanded === feature.id} onChange={handleChange(feature.id)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography component="span">{feature.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    sx={{
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {feature.description.replace('{type}', setupData.congregation.type)}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        />
        {children.map((child) => renderFeature(child, depth + 1))}
      </Box>
    );
  };

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
          <Switch checked={normalizedSelectedFeatures.length === features.length} />

          <Typography fontWeight="bold">{t('form.field.selectAll')}</Typography>
        </Box>

        {getRootFeatures(features).map((feature) => renderFeature(feature))}
      </Box>
    </FormContainer>
  );
};

export default FeaturesStep;
