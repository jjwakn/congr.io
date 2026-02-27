import type { BackgroundMode } from './types';

export interface BrandingFormCardProps {
  smallLogo: File | null;
  bigLogo: File | null;
  backgroundMode: BackgroundMode;
  roundedCorners: boolean;
  cornerRadiusPercent: number;
  appName: string;
  shortName: string;
  error: string;
  success: string;
  canGenerate: boolean;
  isGenerating: boolean;
  onSmallLogoChange: (file: File | null) => void;
  onBigLogoChange: (file: File | null) => void;
  onBackgroundModeChange: (mode: BackgroundMode) => void;
  onRoundedCornersChange: (value: boolean) => void;
  onCornerRadiusPercentChange: (value: number) => void;
  onAppNameChange: (value: string) => void;
  onShortNameChange: (value: string) => void;
  onGenerate: () => void;
}
