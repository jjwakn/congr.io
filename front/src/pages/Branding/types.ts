export type BackgroundMode = 'transparent' | 'white' | 'black';

export type BrandingPreviewItem = {
  id: string;
  label: string;
  path: string;
  url: string;
};

export type GeneratedBrandingAssets = {
  smallLogoPng: Uint8Array;
  bigLogoPng: Uint8Array;
  icon192: Uint8Array;
  icon512: Uint8Array;
  appleTouchIcon: Uint8Array;
  favicon16: Uint8Array;
  favicon32: Uint8Array;
  favicon48: Uint8Array;
  faviconIco: Uint8Array;
  manifestBytes: Uint8Array;
};

export type BrandingGenerationInput = {
  smallLogoFile: File;
  bigLogoFile: File;
  backgroundMode: BackgroundMode;
  roundedCorners: boolean;
  cornerRadiusPercent: number;
  appName: string;
  shortName: string;
};
