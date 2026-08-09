import type { TextFieldProps } from '@mui/material';

export interface LocalizedDateFieldProps extends Omit<TextFieldProps, 'onChange' | 'type' | 'value'> {
  value?: string | null;
  onChange: (value: string) => void;
}
