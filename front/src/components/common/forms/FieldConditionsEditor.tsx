import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Button, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import type { FieldCondition, FieldConditionOperator } from '@/types/person.types';
import type { FieldConditionsEditorProps } from './FieldConditionsEditor.types';

const EMPTY_OPERATORS: FieldConditionOperator[] = ['is_empty', 'is_not_empty'];
const TEXT_OPERATORS: FieldConditionOperator[] = [
  'is_empty',
  'is_not_empty',
  'equals',
  'contains',
  'starts_with',
  'ends_with',
];
const OPTION_OPERATORS: FieldConditionOperator[] = ['is_empty', 'is_not_empty', 'equals', 'not_equals'];
const NUMBER_OPERATORS: FieldConditionOperator[] = [
  'is_empty',
  'is_not_empty',
  'equals',
  'not_equals',
  'greater_than',
  'greater_or_equal',
  'less_than',
  'less_or_equal',
];
const BOOLEAN_OPERATORS: FieldConditionOperator[] = ['is_true', 'is_false'];

const getOperatorsForField = (type?: string): FieldConditionOperator[] => {
  if (type === 'yes_no') return BOOLEAN_OPERATORS;
  if (type === 'number' || type === 'date') return NUMBER_OPERATORS;
  if (type === 'options') return OPTION_OPERATORS;
  return TEXT_OPERATORS;
};

const operatorExpectsValue = (operator: FieldConditionOperator) =>
  !BOOLEAN_OPERATORS.includes(operator) && !EMPTY_OPERATORS.includes(operator);

const createCondition = (fieldId = ''): FieldCondition => ({
  field_id: fieldId,
  operator: 'equals',
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
        const availableOperators = getOperatorsForField(selectedField?.type);
        const selectedOperator = availableOperators.includes(condition.operator)
          ? condition.operator
          : availableOperators[0];
        const expectsValue = operatorExpectsValue(selectedOperator);
        const optionValues = selectedField?.options ?? [];

        return (
          <Stack key={index} direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              select
              fullWidth
              size="small"
              label={fieldLabel}
              value={condition.field_id}
              disabled={disabled}
              onChange={(event) => {
                const nextField = fields.find((field) => field.id === event.target.value);
                update(index, {
                  field_id: event.target.value,
                  operator: getOperatorsForField(nextField?.type)[0],
                  value: '',
                });
              }}
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
              value={selectedOperator}
              disabled={disabled}
              onChange={(event) => {
                const operator = event.target.value as FieldConditionOperator;
                update(index, {
                  operator,
                  ...(operatorExpectsValue(operator) ? {} : { value: null }),
                });
              }}
            >
              {availableOperators.map((operator) => (
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
                type={selectedField?.type === 'number' ? 'number' : selectedField?.type === 'date' ? 'date' : 'text'}
                label={valueLabel}
                value={condition.value ?? ''}
                disabled={disabled}
                InputLabelProps={selectedField?.type === 'date' ? { shrink: true } : undefined}
                onChange={(event) =>
                  update(index, {
                    value:
                      selectedField?.type === 'number'
                        ? event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                        : event.target.value,
                  })
                }
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
