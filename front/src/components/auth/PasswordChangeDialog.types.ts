export type PasswordChangeDialogVariant = 'own' | 'required' | 'temporary';

export interface PasswordChangeValues {
  [key: string]: string | undefined;
  current_password?: string;
  password: string;
  password_confirmation: string;
}

export interface PasswordChangeFieldErrors {
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export interface PasswordChangeDialogProps {
  open: boolean;
  variant: PasswordChangeDialogVariant;
  submitting: boolean;
  userName?: string;
  onClose?: () => void;
  onSubmit: (values: PasswordChangeValues) => void;
}
