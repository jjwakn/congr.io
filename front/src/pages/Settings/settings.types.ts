import type { SelectChangeEvent } from '@mui/material';
import type { Congregation } from '@/types/congregation.types';
import type { Feature } from '@/types/feature.types';
import type { ThemePaletteConfig } from '@/types/theme.types';
import type { User } from '@/types/user.types';

export interface SettingsPageProps {
  showHeader?: boolean;
}

export type SettingsTabId = 'congregations' | 'ui' | 'eventTypes';

export interface CongregationSettingsDraft {
  name: string;
  type: string;
  timezone: string;
  features?: string[];
}

export interface CongregationCreationLocation {
  order: number;
  name: string;
  address: string;
}

export interface CongregationCreateValues extends CongregationSettingsDraft {
  features: string[];
  locations: CongregationCreationLocation[];
  user_ids: string[];
}

export interface CongregationCreationUsersResponse {
  result: User[];
  total: number;
}

export interface CongregationCreateWizardDialogProps {
  open: boolean;
  submitting: boolean;
  currentUserId: string;
  features: Feature[];
  onClose: () => void;
  onSubmit: (values: CongregationCreateValues) => void;
}

export interface CongregationEditDialogProps {
  congregation: Congregation;
  features: Feature[];
  selected: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CongregationEditValues) => void;
}

export interface CongregationEditValues {
  congregation: CongregationSettingsDraft;
  palette: ThemePaletteConfig;
}

export interface CongregationModulesSelectorProps {
  features: Feature[];
  selected: string[];
  congregationType: string;
  disabled?: boolean;
  onChange: (features: string[]) => void;
}

export interface CongregationDeletionPreview {
  usersDeleted: number;
  usersDetached: number;
  locationsDeleted: number;
  locationsDetached: number;
  events: number;
  eventTypes: number;
  processes: number;
  processSteps: number;
  configurations: number;
}

export interface CongregationDeleteDialogProps {
  congregation: Congregation;
  preview: CongregationDeletionPreview;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface UISettingsTabProps {
  language: 'en' | 'es';
  onLanguageChange: (event: SelectChangeEvent<'en' | 'es'>) => void;
}

export interface PaletteDraftErrors {
  light: Record<keyof ThemePaletteConfig['light'], string | undefined>;
  dark: Record<keyof ThemePaletteConfig['dark'], string | undefined>;
}
