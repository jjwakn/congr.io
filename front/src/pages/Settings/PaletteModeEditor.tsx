import { Box, TextField, Typography } from '@mui/material';
import { ThemePaletteModeConfig } from '../../types/theme.types';
import { PaletteModeEditorProps } from './PaletteModeEditor.types';

export const PaletteModeEditor = ({
  title,
  values,
  labels,
  onChange,
}: PaletteModeEditorProps) => {
  const renderColorField = (
    key: keyof ThemePaletteModeConfig,
    label: string,
    value: string,
  ) => (
    <TextField
      key={key}
      label={label}
      value={value}
      onChange={(event) => onChange(key, event.target.value)}
      size="small"
      fullWidth
      type="color"
      InputLabelProps={{ shrink: true }}
      helperText={value}
    />
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
      <Typography
        variant="subtitle1"
        sx={{
          gridColumn: '1 / -1',
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      {renderColorField('primary', labels.primary, values.primary)}
      {renderColorField('secondary', labels.secondary, values.secondary)}
      {renderColorField(
        'backgroundDefault',
        labels.backgroundDefault,
        values.backgroundDefault,
      )}
      {renderColorField(
        'backgroundPaper',
        labels.backgroundPaper,
        values.backgroundPaper,
      )}
    </Box>
  );
};
