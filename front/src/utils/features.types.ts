import type { Feature } from '@/types/feature.types';

export interface ToggleFeatureSelectionProps {
  features: Feature[];
  selected: string[];
  featureId: string;
  checked: boolean;
}
