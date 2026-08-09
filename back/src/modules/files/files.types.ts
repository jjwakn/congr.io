export type FileProvider = 'local' | 'url' | 'aws' | 'gcp' | 'onedrive' | 'google_drive';

export interface FileProviderStatus {
  id: FileProvider;
  selected: boolean;
  configured: boolean;
  available: boolean;
  missing: string[];
}
