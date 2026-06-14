import type { ThemePaletteModeConfig } from '@/types/theme.types';

export interface PaletteModeEditorProps {
  title: string;
  values: ThemePaletteModeConfig;
  errors?: Partial<Record<keyof ThemePaletteModeConfig, string>>;
  labels: {
    primary: string;
    secondary: string;
    backgroundDefault: string;
    backgroundPaper: string;
  };
  onChange: (key: keyof ThemePaletteModeConfig, value: string) => void;
}
