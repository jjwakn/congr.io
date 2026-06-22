import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { PersonCustomFieldsProps } from './persons.types';

export const PersonCustomFields = ({ fields, values, onChange }: PersonCustomFieldsProps) => {
  const { t } = useTranslation();
  const update = (id: string, value: unknown) => onChange({ ...values, [id]: value });

  return (
    <Stack spacing={1.5}>
      {fields.map((field) => {
        const value = values[field.id];
        if (field.type === 'switch') {
          return (
            <FormControlLabel
              key={field.id}
              control={<Switch checked={Boolean(value)} onChange={(_event, checked) => update(field.id, checked)} />}
              label={field.label}
            />
          );
        }
        if (field.type === 'single_option' || field.type === 'multiple_options') {
          const multiple = field.type === 'multiple_options';
          return (
            <FormControl key={field.id} required={field.required} fullWidth>
              <InputLabel>{field.label}</InputLabel>
              <Select
                multiple={multiple}
                label={field.label}
                value={multiple ? (Array.isArray(value) ? value : []) : (value ?? '')}
                onChange={(event) => update(field.id, event.target.value)}
              >
                {field.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }
        return (
          <TextField
            key={field.id}
            required={field.required}
            fullWidth
            multiline={field.type === 'paragraph'}
            minRows={field.type === 'paragraph' ? 3 : undefined}
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
            label={field.label}
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            helperText={field.required ? t('pages.persons.fieldsCrud.required') : undefined}
            onChange={(event) =>
              update(field.id, field.type === 'number' ? Number(event.target.value) : event.target.value)
            }
          />
        );
      })}
    </Stack>
  );
};
