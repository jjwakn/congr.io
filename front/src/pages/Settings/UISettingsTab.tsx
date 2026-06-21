import { useTheme } from '@hooks/useTheme';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { FRONTEND_VERSION } from '@utils/constants';
import { useTranslation } from 'react-i18next';
import type { UISettingsTabProps } from './settings.types';

export const UISettingsTab = ({ language, onLanguageChange }: UISettingsTabProps) => {
  const { t } = useTranslation();
  const { mode, toggleMode } = useTheme();

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl fullWidth>
          <InputLabel id="settings-language-label">{t('pages.settings.language.label')}</InputLabel>
          <Select
            labelId="settings-language-label"
            value={language}
            label={t('pages.settings.language.label')}
            onChange={onLanguageChange}
          >
            <MenuItem value="en">{t('pages.settings.language.english')}</MenuItem>
            <MenuItem value="es">{t('pages.settings.language.spanish')}</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          fullWidth
          startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          onClick={toggleMode}
          aria-label={t('pages.settings.themeMode.ariaLabel')}
          sx={{ minHeight: 40 }}
        >
          {mode === 'dark' ? t('pages.settings.themeMode.toggleToLight') : t('pages.settings.themeMode.toggleToDark')}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Stack>
  );
};
