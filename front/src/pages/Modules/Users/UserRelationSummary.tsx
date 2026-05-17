import { TextField } from '@mui/material';
import type { UserRelationSummaryProps } from './users.types';

export const UserRelationSummary = ({ label, values, emptyText }: UserRelationSummaryProps) => (
  <TextField
    fullWidth
    multiline
    minRows={1}
    label={label}
    value={values.length ? values.join(', ') : emptyText}
    disabled
  />
);
