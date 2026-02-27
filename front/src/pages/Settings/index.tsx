import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithResources } from '../../../i18n';
import { useNotificationContext } from '../../hooks/useNotifications';
import { useTheme } from '../../hooks/useTheme';
import { ConfigurationsService } from '../../services/configurations';
import { ThemePaletteConfig } from '../../types/theme.types';
import { FRONTEND_VERSION } from '../../utils/constants';
import { HttpRequestError, httpRequest } from '../../utils/http';
import { normalizeThemePaletteConfig } from '../../utils/theme';
import { PaletteModeEditor } from './PaletteModeEditor';

const SettingsPage = () => {
  const { i18n, t } = useTranslation();
  const { mode, toggleMode, paletteConfig, setPaletteConfig } = useTheme();
  const { showNotification } = useNotificationContext();
  const [draft, setDraft] = useState<ThemePaletteConfig>(paletteConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const updateModeColor = useCallback(
    (
      mode: keyof ThemePaletteConfig,
      key: keyof ThemePaletteConfig['light'],
      value: string,
    ) => {
      setDraft((previous) => ({
        ...previous,
        [mode]: {
          ...previous[mode],
          [key]: value,
        },
      }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    const normalized = normalizeThemePaletteConfig(paletteConfig);
    setDraft(normalized);
    setError('');
  }, [paletteConfig]);

  const handleLanguageChange = useCallback(
    (event: SelectChangeEvent<'en' | 'es'>) => {
      const nextLanguage = event.target.value;
      if (!nextLanguage) return;
      if (!i18n.language?.startsWith(nextLanguage))
        void changeLanguageWithResources(nextLanguage);
    },
    [i18n],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError('');

    try {
      const payload = normalizeThemePaletteConfig(draft);
      const saved = await httpRequest<ThemePaletteConfig>({
        service: ConfigurationsService.updateTheme,
        data: payload,
      });

      const normalized = normalizeThemePaletteConfig(saved);
      setPaletteConfig(normalized);
      setDraft(normalized);
      showNotification(t('pages.settings.success.saved'), {
        severity: 'success',
      });
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.error.saveFailed');
      setError(message);
      showNotification(message, { severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [draft, setPaletteConfig, showNotification, t]);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      setIsLoading(true);
      try {
        const data = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.getTheme,
        });
        if (!active) return;

        const normalized = normalizeThemePaletteConfig(data);
        setPaletteConfig(normalized);
        setDraft(normalized);
      } catch (value) {
        if (!active) return;
        const message =
          value instanceof HttpRequestError || value instanceof Error
            ? value.message
            : t('pages.settings.error.loadFailed');
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadTheme();

    return () => {
      active = false;
    };
  }, [setPaletteConfig, t]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('pages.settings.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('pages.settings.subtitle')}
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
        }}
      >
        <FormControl fullWidth>
          <InputLabel id="configuration-language-label">
            {t('pages.settings.language.label')}
          </InputLabel>
          <Select
            labelId="configuration-language-label"
            value={i18n.language?.startsWith('es') ? 'es' : 'en'}
            label={t('pages.settings.language.label')}
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">
              {t('pages.settings.language.english')}
            </MenuItem>
            <MenuItem value="es">
              {t('pages.settings.language.spanish')}
            </MenuItem>
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
          {mode === 'dark'
            ? t('pages.settings.themeMode.toggleToLight')
            : t('pages.settings.themeMode.toggleToDark')}
        </Button>
      </Stack>

      <PaletteModeEditor
        title={t('pages.settings.lightMode')}
        values={draft.light}
        labels={{
          primary: t('pages.settings.fields.primary'),
          secondary: t('pages.settings.fields.secondary'),
          backgroundDefault: t('pages.settings.fields.backgroundDefault'),
          backgroundPaper: t('pages.settings.fields.backgroundPaper'),
        }}
        onChange={(key, value) => {
          updateModeColor('light', key, value);
        }}
      />

      <PaletteModeEditor
        title={t('pages.settings.darkMode')}
        values={draft.dark}
        labels={{
          primary: t('pages.settings.fields.primary'),
          secondary: t('pages.settings.fields.secondary'),
          backgroundDefault: t('pages.settings.fields.backgroundDefault'),
          backgroundPaper: t('pages.settings.fields.backgroundPaper'),
        }}
        onChange={(key, value) => {
          updateModeColor('dark', key, value);
        }}
      />

      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button variant="outlined" onClick={handleReset} disabled={isSaving}>
          {t('pages.settings.actions.reset')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || isLoading}
        >
          {t('pages.settings.actions.save')}
        </Button>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'right' }}
      >
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Paper>
  );
};

export default SettingsPage;
