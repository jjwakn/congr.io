import { useAppContext } from '@hooks/useAppContext';
import { useNotificationContext } from '@hooks/useNotifications';
import { useTheme } from '@hooks/useTheme';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import { ConfigurationsService } from '@services/configurations';
import { CongregationsService } from '@services/congregations';
import { getSupportedTimeZones } from '@utils/datetime';
import { HttpRequestError, httpRequest } from '@utils/http';
import { areThemePaletteConfigsEqual, isHexColor, normalizeThemePaletteConfig } from '@utils/theme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Congregation } from '@/types/congregation.types';
import type { ThemePaletteConfig } from '@/types/theme.types';
import { PaletteModeEditor } from './PaletteModeEditor';
import type { CongregationSettingsDraft, CongregationSettingsSectionProps } from './settings.types';

const normalizeDraft = (congregation: Congregation): CongregationSettingsDraft => ({
  name: congregation.name.trim(),
  type: congregation.type.trim(),
  timezone: congregation.timezone.trim(),
});

const areDraftsEqual = (left: CongregationSettingsDraft, right: CongregationSettingsDraft) =>
  left.name === right.name && left.type === right.type && left.timezone === right.timezone;

const isPaletteValid = (palette: ThemePaletteConfig) =>
  Object.values(palette.light).every(isHexColor) && Object.values(palette.dark).every(isHexColor);

export const CongregationSettingsSection = ({
  congregation,
  selected,
  canUpdate,
  onUpdated,
}: CongregationSettingsSectionProps) => {
  const { t } = useTranslation();
  const { selectCongregation } = useAppContext();
  const { showNotification } = useNotificationContext();
  const { setPaletteConfig } = useTheme();
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const filterTimeZones = useMemo(() => createFilterOptions<string>(), []);
  const normalizedCongregation = useMemo(() => normalizeDraft(congregation), [congregation]);
  const [draft, setDraft] = useState(normalizedCongregation);
  const [savedPalette, setSavedPalette] = useState<ThemePaletteConfig | null>(null);
  const [paletteDraft, setPaletteDraft] = useState<ThemePaletteConfig | null>(null);
  const [loadingPalette, setLoadingPalette] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasCongregationChanges = !areDraftsEqual(draft, normalizedCongregation);
  const hasPaletteChanges = Boolean(
    paletteDraft && savedPalette && !areThemePaletteConfigsEqual(paletteDraft, savedPalette),
  );
  const hasPaletteErrors = Boolean(paletteDraft && !isPaletteValid(paletteDraft));

  const paletteErrors = useMemo(
    () => ({
      light: {
        primary:
          paletteDraft && !isHexColor(paletteDraft.light.primary) ? t('pages.settings.error.invalidHex') : undefined,
        secondary:
          paletteDraft && !isHexColor(paletteDraft.light.secondary) ? t('pages.settings.error.invalidHex') : undefined,
        backgroundDefault:
          paletteDraft && !isHexColor(paletteDraft.light.backgroundDefault)
            ? t('pages.settings.error.invalidHex')
            : undefined,
        backgroundPaper:
          paletteDraft && !isHexColor(paletteDraft.light.backgroundPaper)
            ? t('pages.settings.error.invalidHex')
            : undefined,
      },
      dark: {
        primary:
          paletteDraft && !isHexColor(paletteDraft.dark.primary) ? t('pages.settings.error.invalidHex') : undefined,
        secondary:
          paletteDraft && !isHexColor(paletteDraft.dark.secondary) ? t('pages.settings.error.invalidHex') : undefined,
        backgroundDefault:
          paletteDraft && !isHexColor(paletteDraft.dark.backgroundDefault)
            ? t('pages.settings.error.invalidHex')
            : undefined,
        backgroundPaper:
          paletteDraft && !isHexColor(paletteDraft.dark.backgroundPaper)
            ? t('pages.settings.error.invalidHex')
            : undefined,
      },
    }),
    [paletteDraft, t],
  );

  useEffect(() => {
    setDraft(normalizedCongregation);
  }, [normalizedCongregation]);

  useEffect(() => {
    let active = true;

    const loadPalette = async () => {
      setLoadingPalette(true);
      setError('');
      try {
        const result = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.getTheme,
          headers: { 'X-Congregation-Id': congregation.id },
        });
        if (!active) return;
        const normalized = normalizeThemePaletteConfig(result);
        setSavedPalette(normalized);
        setPaletteDraft(normalized);
        if (selected) setPaletteConfig(normalized);
      } catch (value) {
        if (!active) return;
        setError(
          value instanceof HttpRequestError || value instanceof Error
            ? value.message
            : t('pages.settings.error.loadFailed'),
        );
      } finally {
        if (active) setLoadingPalette(false);
      }
    };

    void loadPalette();
    return () => {
      active = false;
    };
  }, [congregation.id, selected, setPaletteConfig, t]);

  const updatePaletteColor = useCallback(
    (mode: keyof ThemePaletteConfig, key: keyof ThemePaletteConfig['light'], value: string) => {
      setPaletteDraft((current) => {
        if (!current) return current;
        const next = { ...current, [mode]: { ...current[mode], [key]: value } };
        if (selected && isPaletteValid(next)) setPaletteConfig(next);
        return next;
      });
    },
    [selected, setPaletteConfig],
  );

  const handleReset = () => {
    setDraft(normalizedCongregation);
    setPaletteDraft(savedPalette);
    setError('');
    if (selected && savedPalette) setPaletteConfig(savedPalette);
  };

  const handleSave = async () => {
    if ((!hasCongregationChanges && !hasPaletteChanges) || hasPaletteErrors) return;
    setSaving(true);
    setError('');

    try {
      let updatedCongregation = congregation;
      if (hasCongregationChanges) {
        updatedCongregation = await httpRequest<Congregation>({
          service: CongregationsService.update,
          data: { id: congregation.id, ...draft },
          headers: { 'X-Congregation-Id': congregation.id },
        });
      }

      if (hasPaletteChanges && paletteDraft) {
        const result = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.updateTheme,
          data: normalizeThemePaletteConfig(paletteDraft),
          headers: { 'X-Congregation-Id': congregation.id },
        });
        const normalized = normalizeThemePaletteConfig(result);
        setSavedPalette(normalized);
        setPaletteDraft(normalized);
        if (selected) setPaletteConfig(normalized);
      }

      if (selected) selectCongregation(updatedCongregation);
      await onUpdated();
      showNotification(t('pages.settings.success.saved'), { severity: 'success' });
    } catch (value) {
      const message =
        value instanceof HttpRequestError || value instanceof Error
          ? value.message
          : t('pages.settings.error.saveFailed');
      setError(message);
      showNotification(message, { severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const labels = {
    primary: t('pages.settings.fields.primary'),
    secondary: t('pages.settings.fields.secondary'),
    backgroundDefault: t('pages.settings.fields.backgroundDefault'),
    backgroundPaper: t('pages.settings.fields.backgroundPaper'),
  };

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">{congregation.name}</Typography>
        {selected ? (
          <Typography variant="caption" color="primary.main">
            {t('pages.settings.congregation.current')}
          </Typography>
        ) : null}
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField
          fullWidth
          label={t('form.field.name')}
          value={draft.name}
          disabled={!canUpdate || saving}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
        />
        <TextField
          fullWidth
          label={t('form.field.type')}
          value={draft.type}
          disabled={!canUpdate || saving}
          onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
        />
        <Autocomplete
          disableClearable
          freeSolo
          fullWidth
          disabled={!canUpdate || saving}
          options={supportedTimeZones}
          inputValue={draft.timezone}
          onInputChange={(_event, value) => setDraft((current) => ({ ...current, timezone: value }))}
          filterOptions={(options, params) => {
            const filtered = filterTimeZones(options, params);
            if (
              params.inputValue &&
              !options.some((option) => option.toLowerCase() === params.inputValue.toLowerCase())
            )
              filtered.push(params.inputValue);
            return filtered;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('form.field.timezone')}
              helperText={t('pages.settings.congregation.timezoneHelp')}
            />
          )}
        />
      </Stack>

      <Accordion disableGutters defaultExpanded={false} variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography>{t('pages.settings.congregation.palette')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {paletteDraft ? (
            <Stack spacing={2}>
              <PaletteModeEditor
                title={t('pages.settings.lightMode')}
                disabled={!canUpdate || saving}
                values={paletteDraft.light}
                errors={paletteErrors.light}
                labels={labels}
                onChange={(key, value) => updatePaletteColor('light', key, value)}
              />
              <PaletteModeEditor
                title={t('pages.settings.darkMode')}
                disabled={!canUpdate || saving}
                values={paletteDraft.dark}
                errors={paletteErrors.dark}
                labels={labels}
                onChange={(key, value) => updatePaletteColor('dark', key, value)}
              />
            </Stack>
          ) : (
            <Typography color="text.secondary">{t('pages.settings.congregation.paletteLoading')}</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {canUpdate ? (
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={saving || (!hasCongregationChanges && !hasPaletteChanges)}
          >
            {t('pages.settings.actions.reset')}
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={saving || loadingPalette || hasPaletteErrors || (!hasCongregationChanges && !hasPaletteChanges)}
          >
            {t('pages.settings.actions.save')}
          </Button>
        </Stack>
      ) : null}

      <Divider />
    </Stack>
  );
};
