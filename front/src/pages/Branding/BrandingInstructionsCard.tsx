import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const BrandingInstructionsCard = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('brandingGenerator.instructionsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('brandingGenerator.instructionsIntro')}
        </Typography>
        <Box component="ol" sx={{ pl: 2, m: 0 }}>
          <li>
            <Typography variant="body2">
              {t('brandingGenerator.instructions.step1')}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              {t('brandingGenerator.instructions.step2')}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              {t('brandingGenerator.instructions.step3')}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              {t('brandingGenerator.instructions.step4')}
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              {t('brandingGenerator.instructions.step5')}
            </Typography>
          </li>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BrandingInstructionsCard;
