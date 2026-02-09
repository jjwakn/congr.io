export type LogoBackgroundMode = 'transparent' | 'white' | 'black';

type BrandingManifest = {
  logo_background_mode?: LogoBackgroundMode;
};

const MANIFEST_PATH = '/manifest.webmanifest';
let manifestRequest: Promise<BrandingManifest | null> | null = null;

const isLogoBackgroundMode = (value: unknown): value is LogoBackgroundMode =>
  value === 'transparent' || value === 'white' || value === 'black';

const fetchBrandingManifest = async (): Promise<BrandingManifest | null> => {
  try {
    const response = await fetch(MANIFEST_PATH, {
      cache: 'no-store',
      credentials: 'same-origin',
    });

    if (!response.ok) return null;

    const data = (await response.json()) as BrandingManifest;
    return data;
  } catch {
    return null;
  }
};

export const getBrandingManifest =
  async (): Promise<BrandingManifest | null> => {
    if (!manifestRequest) manifestRequest = fetchBrandingManifest();
    return manifestRequest;
  };

export const getLogoBackgroundMode = async (): Promise<LogoBackgroundMode> => {
  const manifest = await getBrandingManifest();
  const mode = manifest?.logo_background_mode;

  if (isLogoBackgroundMode(mode)) return mode;
  return 'transparent';
};

export const clearBrandingManifestCache = () => {
  manifestRequest = null;
};
