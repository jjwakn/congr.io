export interface ProviderStatus {
  id: string;
  selected: boolean;
  configured: boolean;
  available: boolean;
  missing: string[];
}
