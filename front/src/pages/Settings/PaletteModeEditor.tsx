import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import { isHexColor } from '@utils/theme';
import { useRef } from 'react';
import { ThemePaletteModeConfig } from '@/types/theme.types';
import { PaletteModeEditorProps } from './PaletteModeEditor.types';

export const PaletteModeEditor = ({
  title,
  disabled = false,
  previewDisabled = false,
  previewLabel,
  values,
  errors,
  labels,
  onChange,
  onPreview,
}: PaletteModeEditorProps) => {
  const colorInputsRef = useRef<Partial<Record<keyof ThemePaletteModeConfig, HTMLInputElement | null>>>({});

  const getPickerValue = (value: string): string => {
    if (!isHexColor(value)) return '#000000';

    const normalized = value.trim();

    if (normalized.length === 4) {
      return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }

    if (normalized.length >= 7) return normalized.slice(0, 7);

    return '#000000';
  };

  const renderColorField = (key: keyof ThemePaletteModeConfig, label: string, value: string) => (
    <Box
      key={key}
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 1,
        alignItems: 'start',
      }}
    >
      <TextField
        label={label}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(key, event.target.value)}
        size="small"
        fullWidth
        placeholder="#1976d2"
        error={Boolean(errors?.[key])}
        helperText={errors?.[key] ?? value}
        inputProps={{
          spellCheck: false,
          autoCapitalize: 'off',
        }}
      />

      <Box sx={{ position: 'relative' }}>
        <input
          ref={(node) => {
            colorInputsRef.current[key] = node;
          }}
          type="color"
          value={getPickerValue(value)}
          onChange={(event) => onChange(key, event.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
          }}
          tabIndex={-1}
          aria-hidden
        />

        <IconButton
          aria-label={label}
          disabled={disabled}
          onClick={() => colorInputsRef.current[key]?.click()}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: isHexColor(value) ? value : 'transparent',
            '&:hover': {
              backgroundColor: isHexColor(value) ? value : 'action.hover',
              opacity: 0.9,
            },
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          gridColumn: '1 / -1',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {onPreview && previewLabel ? (
          <Button
            startIcon={<PreviewRoundedIcon />}
            disabled={disabled || previewDisabled}
            onClick={onPreview}
            variant="outlined"
          >
            {previewLabel}
          </Button>
        ) : null}
      </Stack>
      {renderColorField('primary', labels.primary, values.primary)}
      {renderColorField('secondary', labels.secondary, values.secondary)}
      {renderColorField('backgroundDefault', labels.backgroundDefault, values.backgroundDefault)}
      {renderColorField('backgroundPaper', labels.backgroundPaper, values.backgroundPaper)}
    </Box>
  );
};
