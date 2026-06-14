import type { Feature } from '@/types/feature.types';
import type { SetupData } from '@/types/setup.types';

export interface SetupContextType {
  setupData: SetupData;
  setSetupData: (data: SetupData | ((prev: SetupData) => SetupData)) => void;
  activeStep: number;
  setActiveStep: (step: number | ((prev: number) => number)) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  features: Feature[];
  setFeatures: (features: Feature[]) => void;
  loadingFeatures: boolean;
  setLoadingFeatures: (loading: boolean) => void;
}
