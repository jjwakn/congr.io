import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Checkbox, Typography } from '@mui/material';
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
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const handleToggle = (featureId: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) {
      const addWithPrerequisites = (id: string) => {
        next.add(id);
        const feature = features.find(({ id: candidateId }) => candidateId === id);
        feature?.prerequisites?.forEach(addWithPrerequisites);
      };
      addWithPrerequisites(featureId);
    } else {
      const removeWithDependents = (id: string) => {
        next.delete(id);
        features
          .filter(({ prerequisites }) => prerequisites?.includes(id))
          .forEach(({ id: dependentId }) => {
            removeWithDependents(dependentId);
          });
      };
      removeWithDependents(featureId);
    }

    features.filter(({ required }) => required).forEach(({ id }) => next.add(id));
    onChange(features.filter(({ id }) => next.has(id)).map(({ id }) => id));
  };

  const allSelected = features.length > 0 && features.every(({ id }) => selectedSet.has(id));

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t('pages.settings.congregation.modules.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('pages.settings.congregation.modules.description')}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Checkbox
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

      {features.map((feature) => (
        <Box key={feature.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Checkbox
            checked={selectedSet.has(feature.id)}
            disabled={disabled || feature.required}
            inputProps={{ 'aria-label': feature.title }}
            onChange={(event) => handleToggle(feature.id, event.target.checked)}
            sx={{ mt: 0.5 }}
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
      ))}
    </Box>
  );
};
