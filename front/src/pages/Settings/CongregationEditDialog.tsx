import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  createFilterOptions,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import type { PaletteMode } from '@mui/material/styles';
import { ConfigurationsService } from '@services/configurations';
import { getSupportedTimeZones } from '@utils/datetime';
import { HttpRequestError, httpRequest } from '@utils/http';
import { DEFAULT_THEME_PALETTE_CONFIG, isHexColor, normalizeThemePaletteConfig } from '@utils/theme';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemePaletteConfig } from '@/types/theme.types';
import { CongregationBrandingEditor } from './CongregationBrandingEditor';
import { CongregationModulesSelector } from './CongregationModulesSelector';
import { PaletteModeEditor } from './PaletteModeEditor';
import { PalettePreviewDialog } from './PalettePreviewDialog';
import type { CongregationEditDialogProps, CongregationSettingsDraft } from './settings.types';

export const CongregationEditDialog = ({
  congregation,
  features,
  submitting,
  onClose,
  onSubmit,
}: CongregationEditDialogProps) => {
  const { t } = useTranslation();
  const muiTheme = useMuiTheme();
  const fullScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const requiredFeatures = features.filter(({ required }) => required).map(({ id }) => id);
  const [activeTab, setActiveTab] = useState<'info' | 'palette'>('info');
  const [draft, setDraft] = useState<CongregationSettingsDraft>({
    name: congregation.name,
    type: congregation.type,
    timezone: congregation.timezone,
    features: Array.from(new Set([...(congregation.features ?? []), ...requiredFeatures])),
    max_favorites: congregation.max_favorites ?? 10,
    logo_small_file_id: congregation.logo_small_file_id,
    logo_big_file_id: congregation.logo_big_file_id,
  });
  const [palette, setPalette] = useState<ThemePaletteConfig>(DEFAULT_THEME_PALETTE_CONFIG);
  const [previewMode, setPreviewMode] = useState<PaletteMode | null>(null);
  const [loadingPalette, setLoadingPalette] = useState(true);
  const [error, setError] = useState('');
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const filterTimeZones = useMemo(() => createFilterOptions<string>(), []);

  const paletteErrors = useMemo(
    () => ({
      light: {
        primary: !isHexColor(palette.light.primary) ? t('pages.settings.error.invalidHex') : undefined,
        secondary: !isHexColor(palette.light.secondary) ? t('pages.settings.error.invalidHex') : undefined,
        backgroundDefault: !isHexColor(palette.light.backgroundDefault)
          ? t('pages.settings.error.invalidHex')
          : undefined,
        backgroundPaper: !isHexColor(palette.light.backgroundPaper) ? t('pages.settings.error.invalidHex') : undefined,
      },
      dark: {
        primary: !isHexColor(palette.dark.primary) ? t('pages.settings.error.invalidHex') : undefined,
        secondary: !isHexColor(palette.dark.secondary) ? t('pages.settings.error.invalidHex') : undefined,
        backgroundDefault: !isHexColor(palette.dark.backgroundDefault)
          ? t('pages.settings.error.invalidHex')
          : undefined,
        backgroundPaper: !isHexColor(palette.dark.backgroundPaper) ? t('pages.settings.error.invalidHex') : undefined,
      },
    }),
    [palette, t],
  );
  const hasPaletteErrors =
    Object.values(paletteErrors.light).some(Boolean) || Object.values(paletteErrors.dark).some(Boolean);

  useEffect(() => {
    let active = true;
    const loadPalette = async () => {
      try {
        const result = await httpRequest<ThemePaletteConfig>({
          service: ConfigurationsService.getTheme,
          headers: { 'X-Congregation-Id': congregation.id },
        });
        if (!active) return;
        const normalized = normalizeThemePaletteConfig(result);
        setPalette(normalized);
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
  }, [congregation.id, t]);

  const updatePalette = (mode: keyof ThemePaletteConfig, key: keyof ThemePaletteConfig['light'], value: string) => {
    setPalette((current) => ({ ...current, [mode]: { ...current[mode], [key]: value } }));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = () => {
    const normalized = {
      name: draft.name.trim(),
      type: draft.type.trim(),
      timezone: draft.timezone.trim(),
      features: draft.features ?? [],
      max_favorites: draft.max_favorites ?? 10,
      logo_small_file_id: draft.logo_small_file_id,
      logo_big_file_id: draft.logo_big_file_id,
    };
    if (!normalized.name || !normalized.type || !normalized.timezone || hasPaletteErrors) return;
    onSubmit({ congregation: normalized, palette: normalizeThemePaletteConfig(palette) });
  };

  const labels = {
    primary: t('pages.settings.fields.primary'),
    secondary: t('pages.settings.fields.secondary'),
    backgroundDefault: t('pages.settings.fields.backgroundDefault'),
    backgroundPaper: t('pages.settings.fields.backgroundPaper'),
  };

  return (
    <>
      <Dialog open fullWidth maxWidth="lg" fullScreen={fullScreen} onClose={submitting ? undefined : handleClose}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {t('pages.settings.congregation.editTitle', { name: congregation.name })}
          <Tooltip title={t('form.field.close')}>
            <IconButton onClick={handleClose} disabled={submitting} aria-label={t('form.field.close')}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <Tabs value={activeTab} onChange={(_event, value: 'info' | 'palette') => setActiveTab(value)} sx={{ px: 3 }}>
          <Tab value="info" label={t('pages.settings.congregation.editTabs.info')} />
          <Tab value="palette" label={t('pages.settings.congregation.editTabs.palette')} />
        </Tabs>

        <DialogContent dividers>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {activeTab === 'info' ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                autoFocus
                fullWidth
                required
                label={t('form.field.name')}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
              <TextField
                fullWidth
                required
                label={t('form.field.type')}
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
              />
              <Autocomplete
                disableClearable
                freeSolo
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
                    required
                    label={t('form.field.timezone')}
                    helperText={t('pages.settings.congregation.timezoneHelp')}
                  />
                )}
              />
              <CongregationModulesSelector
                features={features}
                selected={draft.features ?? []}
                congregationType={draft.type}
                onChange={(nextFeatures) => setDraft((current) => ({ ...current, features: nextFeatures }))}
              />
              <TextField
                type="number"
                label={t('pages.settings.congregation.maxFavorites')}
                value={draft.max_favorites ?? 10}
                inputProps={{ min: 1, max: 50 }}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    max_favorites: Math.min(50, Math.max(1, Number(event.target.value) || 1)),
                  }))
                }
                helperText={t('pages.settings.congregation.maxFavoritesHelp')}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <CongregationBrandingEditor
                congregationId={congregation.id}
                smallLogoId={draft.logo_small_file_id}
                bigLogoId={draft.logo_big_file_id}
                disabled={submitting}
                onChange={({ smallLogoId, bigLogoId }) =>
                  setDraft((current) => ({
                    ...current,
                    logo_small_file_id: smallLogoId,
                    logo_big_file_id: bigLogoId,
                  }))
                }
              />
              <PaletteModeEditor
                title={t('pages.settings.lightMode')}
                values={palette.light}
                errors={paletteErrors.light}
                labels={labels}
                disabled={loadingPalette}
                previewDisabled={Object.values(paletteErrors.light).some(Boolean)}
                previewLabel={t('pages.settings.actions.preview')}
                onChange={(key, value) => updatePalette('light', key, value)}
                onPreview={() => setPreviewMode('light')}
              />
              <PaletteModeEditor
                title={t('pages.settings.darkMode')}
                values={palette.dark}
                errors={paletteErrors.dark}
                labels={labels}
                disabled={loadingPalette}
                previewDisabled={Object.values(paletteErrors.dark).some(Boolean)}
                previewLabel={t('pages.settings.actions.preview')}
                onChange={(key, value) => updatePalette('dark', key, value)}
                onPreview={() => setPreviewMode('dark')}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            {t('pages.settings.actions.discard')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              submitting ||
              loadingPalette ||
              hasPaletteErrors ||
              !draft.name.trim() ||
              !draft.type.trim() ||
              !draft.timezone.trim()
            }
          >
            {t('pages.settings.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>
      {previewMode ? (
        <PalettePreviewDialog
          open
          mode={previewMode}
          paletteConfig={normalizeThemePaletteConfig(palette)}
          congregationName={draft.name.trim() || congregation.name}
          onClose={() => setPreviewMode(null)}
        />
      ) : null}
    </>
  );
};
