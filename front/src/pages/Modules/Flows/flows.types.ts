import type { Process, ProcessInput, ProcessStepInput } from '@/types/process.types';

export interface FlowEditorDialogProps {
  flow?: Process | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (value: ProcessInput) => void;
}

export interface FlowStepDraft extends ProcessStepInput {
  position: { x: number; y: number };
}
