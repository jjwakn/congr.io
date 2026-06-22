import { TextField } from '@mui/material';
import { formatDateForInput, getDateInputPlaceholder, parseDateInput } from '@utils/datetime';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalizedDateFieldProps } from './LocalizedDateField.types';

export const LocalizedDateField = ({ value, onChange, helperText, ...props }: LocalizedDateFieldProps) => {
  const { i18n, t } = useTranslation();
  const source = `${i18n.language}:${value}`;
  const [fieldState, setFieldState] = useState(() => ({
    source,
    draft: formatDateForInput(value, i18n.language),
    invalid: false,
  }));
  if (fieldState.source !== source) {
    setFieldState({ source, draft: formatDateForInput(value, i18n.language), invalid: false });
  }

  const commit = (nextValue: string) => {
    const parsed = parseDateInput(nextValue, i18n.language);
    if (parsed === null) {
      setFieldState((current) => ({ ...current, invalid: true }));
      return;
    }

    setFieldState((current) => ({ ...current, invalid: false }));
    onChange(parsed);
  };

  return (
    <TextField
      {...props}
      value={fieldState.draft}
      error={props.error || fieldState.invalid}
      placeholder={getDateInputPlaceholder(i18n.language)}
      helperText={fieldState.invalid ? t('form.error.invalidDate') : helperText}
      onBlur={() => commit(fieldState.draft)}
      onChange={(event) => {
        const nextValue = event.target.value;
        setFieldState((current) => ({ ...current, draft: nextValue }));
        if (!nextValue.trim()) commit(nextValue);
      }}
    />
  );
};
