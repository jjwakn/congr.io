import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import type { ModuleSectionSearchProps } from './ModuleSection.types';

export const ModuleSearchField = ({ label, placeholder, value, onChange, sx }: ModuleSectionSearchProps) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draft, onChange, value]);

  return (
    <TextField
      size="small"
      label={label}
      placeholder={placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      sx={sx}
    />
  );
};
