import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Setup from '../../components/Setup';

const SetupPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('setup.title');
  }, [t]);

  return <Setup />;
};

export default SetupPage;
