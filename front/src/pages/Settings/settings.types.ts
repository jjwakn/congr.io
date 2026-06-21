import type { SelectChangeEvent } from '@mui/material';
import type { Congregation } from '@/types/congregation.types';
import type { ThemePaletteConfig } from '@/types/theme.types';

export interface SettingsPageProps {
  showHeader?: boolean;
}

export type SettingsTabId = 'congregations' | 'ui' | 'eventTypes';

export interface CongregationSettingsDraft {
  name: string;
  type: string;
  timezone: string;
}

export interface CongregationFormDialogProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CongregationSettingsDraft) => void;
}

export interface CongregationSettingsSectionProps {
  congregation: Congregation;
  selected: boolean;
  canUpdate: boolean;
  onUpdated: () => Promise<void>;
}

export interface UISettingsTabProps {
  language: 'en' | 'es';
  onLanguageChange: (event: SelectChangeEvent<'en' | 'es'>) => void;
}

export interface PaletteDraftErrors {
  light: Record<keyof ThemePaletteConfig['light'], string | undefined>;
  dark: Record<keyof ThemePaletteConfig['dark'], string | undefined>;
}
