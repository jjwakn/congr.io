import { ReactNode } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';

export interface FormContainerProps<FormData extends FieldValues> {
  children: ReactNode;
  form: UseFormReturn<FormData, unknown, FormData>;
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  submitText: string;
  loadingTooltip?: string;
  cancelText?: string;
}
