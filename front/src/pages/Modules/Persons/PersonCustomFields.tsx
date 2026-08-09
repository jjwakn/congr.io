import { LocalizedDateField } from '@components/common/forms/LocalizedDateField';
import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { evaluateCalculatedField } from '@utils/customFields';
import { useTranslation } from 'react-i18next';
import type { JsonValue } from '@/types/json.types';
import type { PersonCustomFieldsProps } from './persons.types';

export const PersonCustomFields = ({ fields, standardValues = {}, values, onChange }: PersonCustomFieldsProps) => {
  const { t } = useTranslation();
  const update = (id: string, value: JsonValue | undefined) => onChange({ ...values, [id]: value });

  return (
    <Stack spacing={1.5}>
      {fields.map((field) => {
        const value = values[field.id];
        if (field.type === 'yes_no') {
          const calculated = Boolean(field.calculated_conditions?.length);
          const checked = calculated
            ? evaluateCalculatedField({ field, standardValues, customValues: values })
            : Boolean(value);
          const control = (
            <FormControlLabel
              control={
                <Switch
                  checked={checked}
                  disabled={calculated}
                  onChange={(_event, nextChecked) => update(field.id, nextChecked)}
                />
              }
              label={field.label}
            />
          );
          return calculated ? (
            <Tooltip key={field.id} title={t('pages.persons.fieldsCrud.calculatedTooltip')}>
              <span>{control}</span>
            </Tooltip>
          ) : (
            control
          );
        }
        if (field.type === 'options') {
          const multiple = field.allow_multiple;
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
        return field.type === 'date' ? (
          <LocalizedDateField
            key={field.id}
            required={field.required}
            fullWidth
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            helperText={field.required ? t('pages.persons.fieldsCrud.required') : undefined}
            onChange={(nextValue) => update(field.id, nextValue)}
          />
        ) : (
          <TextField
            key={field.id}
            required={field.required}
            fullWidth
            multiline={field.type === 'paragraph'}
            minRows={field.type === 'paragraph' ? 3 : undefined}
            type={field.type === 'number' ? 'number' : 'text'}
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
