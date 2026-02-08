import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Setup from '../../components/Setup';
import { SetupProvider } from '../../contexts/SetupProvider';

const SetupPage = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('setup.title');
  }, [t]);

  return (
    <SetupProvider>
      <Setup />
    </SetupProvider>
  );
};

export default SetupPage;
