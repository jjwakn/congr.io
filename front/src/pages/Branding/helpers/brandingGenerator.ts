import { BrandingGenerationInput, GeneratedBrandingAssets } from '../types';
import { createIco } from './ico';
import {
  loadImageFromFile,
  normalizeImageToPng,
  renderIcon,
} from './imageGenerator';

const getThemeColor = (
  backgroundMode: BrandingGenerationInput['backgroundMode'],
) => {
  if (backgroundMode === 'black') return '#000000';
  return '#ffffff';
};

export const generateBrandingAssets = async ({
  smallLogoFile,
  bigLogoFile,
  backgroundMode,
  roundedCorners,
  cornerRadiusPercent,
  appName,
  shortName,
}: BrandingGenerationInput): Promise<GeneratedBrandingAssets> => {
  const [smallLogoImage, bigLogoImage] = await Promise.all([
    loadImageFromFile(smallLogoFile),
    loadImageFromFile(bigLogoFile),
  ]);

  const [smallLogoPng, bigLogoPng, icon512, icon192, appleTouchIcon] =
    await Promise.all([
      normalizeImageToPng(smallLogoImage),
      normalizeImageToPng(bigLogoImage),
      renderIcon({
        image: smallLogoImage,
        size: 512,
        backgroundMode,
        roundedCorners,
        cornerRadiusPercent,
      }),
      renderIcon({
        image: smallLogoImage,
        size: 192,
        backgroundMode,
        roundedCorners,
        cornerRadiusPercent,
      }),
      renderIcon({
        image: smallLogoImage,
        size: 180,
        backgroundMode,
        roundedCorners,
        cornerRadiusPercent,
      }),
    ]);

  const [favicon48, favicon32, favicon16] = await Promise.all([
    renderIcon({
      image: smallLogoImage,
      size: 48,
      backgroundMode,
      roundedCorners,
      cornerRadiusPercent,
    }),
    renderIcon({
      image: smallLogoImage,
      size: 32,
      backgroundMode,
      roundedCorners,
      cornerRadiusPercent,
    }),
    renderIcon({
      image: smallLogoImage,
      size: 16,
      backgroundMode,
      roundedCorners,
      cornerRadiusPercent,
    }),
  ]);

  const faviconIco = createIco([favicon16, favicon32, favicon48]);
  const themeColor = getThemeColor(backgroundMode);
  const manifest = JSON.stringify(
    {
      name: appName.trim() || 'Congr.io',
      short_name: shortName.trim() || appName.trim() || 'Congr.io',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: themeColor,
      background_color: themeColor,
      logo_background_mode: backgroundMode,
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    null,
    2,
  );

  return {
    smallLogoPng,
    bigLogoPng,
    icon192,
    icon512,
    appleTouchIcon,
    favicon16,
    favicon32,
    favicon48,
    faviconIco,
    manifestBytes: new TextEncoder().encode(manifest),
  };
};
