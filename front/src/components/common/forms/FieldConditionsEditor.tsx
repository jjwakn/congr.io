import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import type { FieldCondition, FieldConditionOperator } from '@/types/person.types';
import type { FieldConditionsEditorProps } from './FieldConditionsEditor.types';

const OPERATORS: FieldConditionOperator[] = [
  'not_empty',
  'empty',
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'age_greater_than',
  'age_less_than',
];

const createCondition = (fieldId = ''): FieldCondition => ({
  field_id: fieldId,
  operator: 'not_empty',
  value: '',
});

export const FieldConditionsEditor = ({
  fields,
  value,
  fieldLabel,
  operatorLabel,
  valueLabel,
  addLabel,
  removeLabel,
  operatorLabels,
  disabled = false,
  onChange,
}: FieldConditionsEditorProps) => {
  const update = (index: number, patch: Partial<FieldCondition>) =>
    onChange(
      value.map((condition, conditionIndex) => (conditionIndex === index ? { ...condition, ...patch } : condition)),
    );

  return (
    <Stack spacing={1}>
      {value.map((condition, index) => {
        const selectedField = fields.find((field) => field.id === condition.field_id);
        const expectsValue = condition.operator !== 'empty' && condition.operator !== 'not_empty';
        const optionValues = selectedField?.options ?? [];

        return (
          <Stack key={`${index}-${condition.field_id}`} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              select
              fullWidth
              size="small"
              label={fieldLabel}
              value={condition.field_id}
              disabled={disabled}
              onChange={(event) => update(index, { field_id: event.target.value })}
            >
              {fields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  {field.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label={operatorLabel}
              value={condition.operator}
              disabled={disabled}
              onChange={(event) => update(index, { operator: event.target.value as FieldConditionOperator })}
            >
              {OPERATORS.map((operator) => (
                <MenuItem key={operator} value={operator}>
                  {operatorLabels[operator]}
                </MenuItem>
              ))}
            </TextField>
            {expectsValue ? (
              <TextField
                select={optionValues.length > 0}
                fullWidth
                size="small"
                label={valueLabel}
                value={condition.value ?? ''}
                disabled={disabled}
                onChange={(event) => update(index, { value: event.target.value })}
              >
                {optionValues.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <Tooltip title={removeLabel}>
              <span>
                <IconButton
                  color="error"
                  disabled={disabled}
                  onClick={() => onChange(value.filter((_condition, conditionIndex) => conditionIndex !== index))}
                  aria-label={removeLabel}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      })}
      <Button
        startIcon={<AddRoundedIcon />}
        disabled={disabled || !fields.length}
        onClick={() => onChange([...value, createCondition(fields[0]?.id)])}
        sx={{ alignSelf: 'flex-start' }}
      >
        {addLabel}
      </Button>
    </Stack>
  );
};
