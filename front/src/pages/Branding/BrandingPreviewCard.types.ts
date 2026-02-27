import type { BrandingPreviewItem } from './types';

export interface BrandingPreviewCardProps {
  previews: BrandingPreviewItem[];
  isLoading: boolean;
  error: string;
}
