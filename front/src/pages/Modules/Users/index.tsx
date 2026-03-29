import { ModuleSection } from '@components/common/modules/ModuleSection';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { UsersModuleProps } from './users.types';

export const UsersModule = ({ title, description, showSummary = true }: UsersModuleProps) => {
  const { t } = useTranslation();

  return showSummary ? (
    <ModuleSection title={title} description={description} />
  ) : (
    <Typography variant="body2" color="text.secondary">
      {t('pages.modules.users.empty')}
    </Typography>
  );
};
