import { useAppContext } from '@hooks/useAppContext';
import { useNotificationContext } from '@hooks/useNotifications';
import { useTheme } from '@hooks/useTheme';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import { ConfigurationsService } from '@services/configurations';
import { CongregationsService } from '@services/congregations';
import { FRONTEND_VERSION } from '@utils/constants';
import { getSupportedTimeZones } from '@utils/datetime';
import { HttpRequestError, httpRequest } from '@utils/http';
import { areThemePaletteConfigsEqual, isHexColor, normalizeThemePaletteConfig } from '@utils/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemePaletteConfig } from '@/types/theme.types';
import { changeLanguageWithResources } from '../../../i18n';
import { PaletteModeEditor } from './PaletteModeEditor';
import { CongregationSettingsDraft, SettingsPageProps } from './settings.types';

const normalizeCongregationDraft = (value?: Partial<CongregationSettingsDraft> | null): CongregationSettingsDraft => ({
  name: value?.name?.trim() ?? '',
  type: value?.type?.trim() ?? '',
  timezone: value?.timezone?.trim() ?? '',
});

const areCongregationSettingsEqual = (left: CongregationSettingsDraft, right: CongregationSettingsDraft): boolean =>
  left.name === right.name && left.type === right.type && left.timezone === right.timezone;

const SettingsPage = ({ showHeader = true }: SettingsPageProps) => {
  const { i18n, t } = useTranslation();
  const { mode, toggleMode, paletteConfig, setPaletteConfig } = useTheme();
  const { showNotification } = useNotificationContext();
  const { congregation, refreshIsSetup } = useAppContext();
  const filterTimeZones = useMemo(() => createFilterOptions<string>(), []);
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const [draft, setDraft] = useState<ThemePaletteConfig>(paletteConfig);
  const [congregationDraft, setCongregationDraft] = useState<CongregationSettingsDraft>(
    normalizeCongregationDraft(congregation),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const draftErrors = useMemo(
    () => ({
      light: {
        primary: isHexColor(draft.light.primary) ? undefined : t('pages.settings.error.invalidHex'),
        secondary: isHexColor(draft.light.secondary) ? undefined : t('pages.settings.error.invalidHex'),
        backgroundDefault: isHexColor(draft.light.backgroundDefault) ? undefined : t('pages.settings.error.invalidHex'),
        backgroundPaper: isHexColor(draft.light.backgroundPaper) ? undefined : t('pages.settings.error.invalidHex'),
      },
      dark: {
        primary: isHexColor(draft.dark.primary) ? undefined : t('pages.settings.error.invalidHex'),
        secondary: isHexColor(draft.dark.secondary) ? undefined : t('pages.settings.error.invalidHex'),
        backgroundDefault: isHexColor(draft.dark.backgroundDefault) ? undefined : t('pages.settings.error.invalidHex'),
        backgroundPaper: isHexColor(draft.dark.backgroundPaper) ? undefined : t('pages.settings.error.invalidHex'),
      },
    }),
    [draft, t],
  );

  const hasDraftErrors = useMemo(
    () => Object.values(draftErrors.light).some(Boolean) || Object.values(draftErrors.dark).some(Boolean),
    [draftErrors],
  );

  const hasPaletteChanges = useMemo(() => !areThemePaletteConfigsEqual(draft, paletteConfig), [draft, paletteConfig]);
  const normalizedCongregation = useMemo(() => normalizeCongregationDraft(congregation), [congregation]);
  const hasCongregationChanges = useMemo(
    () => !areCongregationSettingsEqual(congregationDraft, normalizedCongregation),
    [congregationDraft, normalizedCongregation],
  );
  const canSave = (hasPaletteChanges || hasCongregationChanges) && !hasDraftErrors;

  const updateModeColor = useCallback(
    (mode: keyof ThemePaletteConfig, key: keyof ThemePaletteConfig['light'], value: string) => {
      setError('');
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
    setCongregationDraft(normalizedCongregation);
    setError('');
  }, [normalizedCongregation, paletteConfig]);

  const handleLanguageChange = useCallback(
    (event: SelectChangeEvent<'en' | 'es'>) => {
      const nextLanguage = event.target.value;
      if (!nextLanguage) return;
      if (!i18n.language?.startsWith(nextLanguage)) void changeLanguageWithResources(nextLanguage);
    },
    [i18n],
  );

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    setIsSaving(true);
    setError('');

    try {
      if (hasCongregationChanges && congregation?.id) {
        await httpRequest({
          service: CongregationsService.update,
          data: {
            id: congregation.id,
            ...normalizeCongregationDraft(congregationDraft),
          },
        });
        await refreshIsSetup();
      }

      if (hasPaletteChanges) {
        const payload = normalizeThemePaletteConfig(draft);
        const saved = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.updateTheme,
          data: payload,
        });

        const normalized = normalizeThemePaletteConfig(saved);
        setPaletteConfig(normalized);
        setDraft(normalized);
      }

      setCongregationDraft(normalizeCongregationDraft(congregationDraft));
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
  }, [
    canSave,
    congregation?.id,
    congregationDraft,
    draft,
    hasCongregationChanges,
    hasPaletteChanges,
    refreshIsSetup,
    setPaletteConfig,
    showNotification,
    t,
  ]);

  useEffect(() => {
    setCongregationDraft(normalizedCongregation);
  }, [normalizedCongregation]);

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
      {showHeader ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('pages.settings.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.settings.subtitle')}
          </Typography>
        </Box>
      ) : null}

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
          <InputLabel id="configuration-language-label">{t('pages.settings.language.label')}</InputLabel>
          <Select
            labelId="configuration-language-label"
            value={i18n.language?.startsWith('es') ? 'es' : 'en'}
            label={t('pages.settings.language.label')}
            onChange={handleLanguageChange}
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

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2,
          display: 'grid',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6">{t('pages.settings.congregation.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('pages.settings.congregation.subtitle')}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label={t('form.field.name')}
          value={congregationDraft.name}
          onChange={(event) => {
            setError('');
            setCongregationDraft((previous) => ({
              ...previous,
              name: event.target.value,
            }));
          }}
        />

        <TextField
          fullWidth
          label={t('form.field.type')}
          value={congregationDraft.type}
          onChange={(event) => {
            setError('');
            setCongregationDraft((previous) => ({
              ...previous,
              type: event.target.value,
            }));
          }}
        />

        <Autocomplete
          disableClearable
          freeSolo
          options={supportedTimeZones}
          inputValue={congregationDraft.timezone}
          onInputChange={(_event, newValue) => {
            setError('');
            setCongregationDraft((previous) => ({
              ...previous,
              timezone: newValue,
            }));
          }}
          onChange={(_event, newValue) => {
            setError('');
            setCongregationDraft((previous) => ({
              ...previous,
              timezone: typeof newValue === 'string' ? newValue : previous.timezone,
            }));
          }}
          filterOptions={(options, params) => {
            const filtered = filterTimeZones(options, params);
            const { inputValue } = params;
            const isExisting = options.some((option) => inputValue.toLowerCase() === option.toLowerCase());

            if (inputValue !== '' && !isExisting) filtered.push(inputValue);

            return filtered;
          }}
          renderOption={({ key, ...optionProps }, option) => (
            <li key={key} {...optionProps}>
              {option}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label={t('form.field.timezone')}
              helperText={t('pages.settings.congregation.timezoneHelp')}
            />
          )}
        />
      </Box>

      <PaletteModeEditor
        title={t('pages.settings.lightMode')}
        values={draft.light}
        errors={draftErrors.light}
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
        errors={draftErrors.dark}
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
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={isSaving || (!hasPaletteChanges && !hasCongregationChanges)}
        >
          {t('pages.settings.actions.reset')}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving || isLoading || !canSave}>
          {t('pages.settings.actions.save')}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
        {t('pages.settings.frontendVersion', { version: FRONTEND_VERSION })}
      </Typography>
    </Paper>
  );
};

export default SettingsPage;
