const MANIFEST_PATH = '/manifest.webmanifest';
const FAVICON_PATH = '/favicon.ico';
const APPLE_TOUCH_ICON_PATH = '/icons/apple-touch-icon.png';

export const syncBrandingHeadLinks = async (): Promise<void> => {
  if (typeof window === 'undefined') return;

  const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
  const manifest = document.getElementById('app-manifest') as HTMLLinkElement | null;
  const appleTouchIcon = document.getElementById('app-apple-touch-icon') as HTMLLinkElement | null;

  if (favicon) favicon.href = FAVICON_PATH;
  if (manifest) manifest.href = MANIFEST_PATH;
  if (appleTouchIcon) appleTouchIcon.href = APPLE_TOUCH_ICON_PATH;
};
