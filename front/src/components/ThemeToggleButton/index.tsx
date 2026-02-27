import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggleButton = () => {
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslation();

  return (
    <IconButton
      onClick={toggleMode}
      color="inherit"
      aria-label={t('footer.themeAriaLabel')}
      size="small"
    >
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};
