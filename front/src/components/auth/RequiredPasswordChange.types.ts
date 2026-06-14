import type { PasswordChangeValues } from './PasswordChangeDialog.types';

export interface RequiredPasswordChangeProps {
  submitting: boolean;
  onSubmit: (values: PasswordChangeValues) => void;
}
