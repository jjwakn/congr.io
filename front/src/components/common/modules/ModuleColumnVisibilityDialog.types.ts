import type { ModuleColumnVisibilityOption } from './ModuleListTable.types';

export interface ModuleColumnVisibilityDialogProps {
  open: boolean;
  title: string;
  options: ModuleColumnVisibilityOption[];
  visibleIds: string[];
  onClose: () => void;
  onSave: (value: string[]) => void;
}
