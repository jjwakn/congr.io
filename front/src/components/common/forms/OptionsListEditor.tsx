import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import type { OptionsListEditorProps } from './OptionsListEditor.types';

export const OptionsListEditor = ({
  label,
  addLabel,
  removeLabel,
  values,
  disabled = false,
  onChange,
}: OptionsListEditorProps) => {
  const updateValue = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>
      {values.map((value, index) => (
        <Stack key={index} direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            value={value}
            disabled={disabled}
            onChange={(event) => updateValue(index, event.target.value)}
          />
          <Tooltip title={removeLabel}>
            <span>
              <IconButton
                color="error"
                disabled={disabled}
                aria-label={removeLabel}
                onClick={() => onChange(values.filter((_option, optionIndex) => optionIndex !== index))}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ))}
      <Button
        startIcon={<AddRoundedIcon />}
        disabled={disabled}
        onClick={() => onChange([...values, ''])}
        sx={{ alignSelf: 'flex-start' }}
      >
        {addLabel}
      </Button>
    </Stack>
  );
};
