import { Autocomplete, TextField } from '@mui/material';
import type { UserRelationOption, UserRelationSelectProps } from './users.types';

const getSelectedOptions = (options: UserRelationOption[], value: string[]) => {
  const selectedIds = new Set(value);

  return options.filter((option) => selectedIds.has(option.id));
};

export const UserRelationSelect = ({
  label,
  options,
  value,
  disabled,
  emptyText,
  helperText,
  sx,
  onChange,
}: UserRelationSelectProps) => (
  <Autocomplete
    multiple
    disableCloseOnSelect
    options={options}
    value={getSelectedOptions(options, value)}
    getOptionLabel={(option) => option.label}
    isOptionEqualToValue={(option, selectedOption) => option.id === selectedOption.id}
    noOptionsText={emptyText}
    disabled={disabled}
    sx={sx}
    onChange={(_event, nextValue) => onChange(nextValue.map((option) => option.id))}
    renderInput={(params) => <TextField {...params} label={label} helperText={helperText} />}
  />
);
