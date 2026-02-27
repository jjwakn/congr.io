import type { SetupData } from '../../../types/setup.types';

export interface ConfirmStepProps {
  data: SetupData;
  onFinish: () => void;
  disabled?: boolean;
  onBack: () => void;
}

export interface ConfirmStepFormData {
  noop: boolean;
}
