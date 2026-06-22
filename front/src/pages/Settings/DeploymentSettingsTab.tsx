import BrandingWatermarkOutlinedIcon from '@mui/icons-material/BrandingWatermarkOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { Button, Stack, Typography } from '@mui/material';
import { getBrandingPath, getFilesPath } from '@utils/routes';
import { useTranslation } from 'react-i18next';

export const DeploymentSettingsTab = () => {
  const { t, i18n } = useTranslation();
  return (
    <Stack spacing={2}>
      <Typography>{t('pages.settings.deployment.description')}</Typography>
      <Button
        href={getBrandingPath(i18n.language)}
        startIcon={<BrandingWatermarkOutlinedIcon />}
        variant="outlined"
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('pages.settings.deployment.branding')}
      </Button>
      <Button
        href={getFilesPath(i18n.language)}
        startIcon={<FolderOutlinedIcon />}
        variant="outlined"
        size="small"
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('pages.settings.deployment.files')}
      </Button>
    </Stack>
  );
};
