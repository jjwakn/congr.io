import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField } from '@mui/material';
import type { EventRegistrationFieldsProps } from './registration.types';

export const EventRegistrationFields = ({
  fields,
  values,
  publicOnly = false,
  onChange,
}: EventRegistrationFieldsProps) => {
  const update = (id: string, value: unknown) => onChange({ ...values, [id]: value });
  return (
    <Stack spacing={1.5}>
      {fields
        .filter((field) => !publicOnly || field.user_fillable)
        .map((field) => {
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
              <FormControl key={field.id} fullWidth required={field.required}>
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
              label={field.label}
              multiline={field.type === 'paragraph'}
              minRows={field.type === 'paragraph' ? 3 : undefined}
              type={field.type === 'number' ? 'number' : 'text'}
              value={typeof value === 'string' || typeof value === 'number' ? value : ''}
              onChange={(event) =>
                update(field.id, field.type === 'number' ? Number(event.target.value) : event.target.value)
              }
            />
          );
        })}
    </Stack>
  );
};
