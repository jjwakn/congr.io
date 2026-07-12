import type { PaletteMode } from '@mui/material/styles';
import type { ThemePaletteConfig } from '@/types/theme.types';

export interface PalettePreviewDialogProps {
  open: boolean;
  mode: PaletteMode;
  paletteConfig: ThemePaletteConfig;
  congregationName: string;
  logoSrc?: string;
  onClose: () => void;
}
