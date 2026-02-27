import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from '../../components/common/FileUploader';
import { BrandingFormCardProps } from './BrandingFormCard.types';
import { BackgroundMode } from './types';

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

const getFirstFile = (value: File | FileList): File | null =>
  value instanceof File ? value : (value[0] ?? null);

const useFilePreviewUrl = (file: File | null) => {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ''),
    [file],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  return previewUrl;
};

const resolveUploaderBackground = (mode: BackgroundMode): string => {
  if (mode === 'white') return '#ffffff';
  if (mode === 'black') return '#000000';
  return 'transparent';
};

const BrandingFormCard = ({
  smallLogo,
  bigLogo,
  backgroundMode,
  roundedCorners,
  cornerRadiusPercent,
  appName,
  shortName,
  error,
  success,
  canGenerate,
  isGenerating,
  onSmallLogoChange,
  onBigLogoChange,
  onBackgroundModeChange,
  onRoundedCornersChange,
  onCornerRadiusPercentChange,
  onAppNameChange,
  onShortNameChange,
  onGenerate,
}: BrandingFormCardProps) => {
  const { t } = useTranslation();
  const smallPreviewUrl = useFilePreviewUrl(smallLogo);
  const bigPreviewUrl = useFilePreviewUrl(bigLogo);
  const uploaderPreviewBackground = resolveUploaderBackground(backgroundMode);

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4">{t('brandingGenerator.title')}</Typography>
        <Typography color="text.secondary">
          {t('brandingGenerator.subtitle')}
        </Typography>

        <Alert severity="warning">
          {t('brandingGenerator.warningRebuild')}
        </Alert>

        <Stack spacing={1}>
          <Typography variant="subtitle2">
            {t('brandingGenerator.smallLogo')}
          </Typography>
          <FileUploader
            name="branding-small-logo"
            types={IMAGE_TYPES}
            fileOrFiles={smallLogo}
            handleChange={(value) => onSmallLogoChange(getFirstFile(value))}
            onDelete={() => onSmallLogoChange(null)}
            showMenu
            previewImage={smallPreviewUrl || undefined}
            previewAlt={t('brandingGenerator.previews.smallLogo')}
            previewBackgroundColor={uploaderPreviewBackground}
          >
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('brandingGenerator.selectSmallLogo')}
              </Typography>
            </Box>
          </FileUploader>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">
            {t('brandingGenerator.bigLogo')}
          </Typography>
          <FileUploader
            name="branding-big-logo"
            types={IMAGE_TYPES}
            fileOrFiles={bigLogo}
            handleChange={(value) => onBigLogoChange(getFirstFile(value))}
            onDelete={() => onBigLogoChange(null)}
            showMenu
            previewImage={bigPreviewUrl || undefined}
            previewAlt={t('brandingGenerator.previews.bigLogo')}
            previewBackgroundColor={uploaderPreviewBackground}
          >
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('brandingGenerator.selectBigLogo')}
              </Typography>
            </Box>
          </FileUploader>
        </Stack>

        <FormControl fullWidth>
          <InputLabel id="background-mode">
            {t('brandingGenerator.backgroundMode')}
          </InputLabel>
          <Select
            labelId="background-mode"
            label={t('brandingGenerator.backgroundMode')}
            value={backgroundMode}
            onChange={(event) =>
              onBackgroundModeChange(event.target.value as BackgroundMode)
            }
          >
            <MenuItem value="transparent">
              {t('brandingGenerator.backgroundTransparent')}
            </MenuItem>
            <MenuItem value="white">
              {t('brandingGenerator.backgroundWhite')}
            </MenuItem>
            <MenuItem value="black">
              {t('brandingGenerator.backgroundBlack')}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={roundedCorners}
              onChange={(event) => onRoundedCornersChange(event.target.checked)}
            />
          }
          label={t('brandingGenerator.roundedCorners')}
        />

        <Box>
          <Typography gutterBottom>
            {t('brandingGenerator.cornerRadius')} ({cornerRadiusPercent}%)
          </Typography>
          <Slider
            disabled={!roundedCorners}
            min={0}
            max={100}
            step={1}
            value={cornerRadiusPercent}
            onChange={(_event, value) =>
              onCornerRadiusPercentChange(
                Array.isArray(value) ? value[0] : value,
              )
            }
            valueLabelFormat={(value) => `${value}%`}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          <TextField
            fullWidth
            sx={{ flex: 1, minWidth: 0 }}
            label={t('brandingGenerator.appName')}
            value={appName}
            onChange={(event) => onAppNameChange(event.target.value)}
          />
          <TextField
            fullWidth
            sx={{ flex: 1, minWidth: 0 }}
            label={t('brandingGenerator.shortName')}
            value={shortName}
            onChange={(event) => onShortNameChange(event.target.value)}
          />
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Button
          variant="contained"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {isGenerating
            ? t('brandingGenerator.generating')
            : t('brandingGenerator.generateButton')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BrandingFormCard;
