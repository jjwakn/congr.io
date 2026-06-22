import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Switch, Typography } from '@mui/material';
import {
  PARTIAL_FEATURE_SWITCH_SX,
  getFeatureChildren,
  getRootFeatures,
  isFeaturePartiallySelected,
  normalizeSelectedFeatures,
  toggleFeatureSelection,
} from '@utils/features';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CongregationModulesSelectorProps } from './settings.types';

export const CongregationModulesSelector = ({
  features,
  selected,
  congregationType,
  disabled = false,
  onChange,
}: CongregationModulesSelectorProps) => {
  const { t } = useTranslation();
  const normalizedSelected = useMemo(() => normalizeSelectedFeatures(features, selected), [features, selected]);
  const selectedSet = useMemo(() => new Set(normalizedSelected), [normalizedSelected]);
  const rootFeatures = useMemo(() => getRootFeatures(features), [features]);

  const handleToggle = (featureId: string, checked: boolean) => {
    onChange(toggleFeatureSelection({ features, selected: normalizedSelected, featureId, checked }));
  };

  const allSelected = features.length > 0 && features.every(({ id }) => selectedSet.has(id));

  const renderFeature = (feature: (typeof features)[number], depth = 0) => {
    const children = getFeatureChildren(features, feature.id);
    const partial = isFeaturePartiallySelected(features, normalizedSelected, feature.id);

    return (
      <Box key={feature.id} sx={{ ml: depth ? 4 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Switch
            checked={selectedSet.has(feature.id)}
            disabled={disabled || feature.required}
            inputProps={{ 'aria-label': feature.title }}
            onChange={(event) => handleToggle(feature.id, event.target.checked)}
            sx={{ mt: 0.5, ...(partial ? PARTIAL_FEATURE_SWITCH_SX : {}) }}
          />
          <Accordion disableGutters elevation={0} sx={{ flex: 1, '&::before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ minHeight: 44 }}>
              <Typography>{feature.title}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {feature.description.replace('{type}', congregationType)}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
        {children.map((child) => renderFeature(child, depth + 1))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('pages.settings.congregation.modules.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('pages.settings.congregation.modules.description')}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Switch
          checked={allSelected}
          disabled={disabled}
          inputProps={{ 'aria-label': t('form.field.selectAll') }}
          onChange={(_event, checked) => {
            onChange(
              checked ? features.map(({ id }) => id) : features.filter(({ required }) => required).map(({ id }) => id),
            );
          }}
        />
        <Typography fontWeight={600}>{t('form.field.selectAll')}</Typography>
      </Box>

      {rootFeatures.map((feature) => renderFeature(feature))}
    </Box>
  );
};
