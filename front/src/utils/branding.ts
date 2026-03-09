import i18n from '../../i18n';
import type { BackgroundMode, BrandingGenerationInput, GeneratedBrandingAssets } from '../pages/Branding/types';

const PREFERRED_ICON_PADDING = 0.7;
const CHIP_SCALE = 0.88;
const PNG_SIGNATURE = '89504e470d0a1a0a';
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

interface RenderIconInput {
  image: HTMLImageElement;
  size: number;
  backgroundMode: BackgroundMode;
  roundedCorners: boolean;
  cornerRadiusPercent: number;
}

interface ZipEntry {
  path: string;
  data: Uint8Array;
  modifiedAt?: Date;
}

const backgroundFillByMode: Record<BackgroundMode, string | null> = {
  transparent: null,
  white: '#ffffff',
  black: '#000000',
};

const getThemeColor = (backgroundMode: BrandingGenerationInput['backgroundMode']) => {
  if (backgroundMode === 'black') return '#000000';
  return '#ffffff';
};

const canvasToPngBytes = async (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error(i18n.t('brandingGenerator.errors.pngGenerationFailed')));
        return;
      }
      resolve(value);
    }, 'image/png');
  });

  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const boundedRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  context.beginPath();
  context.moveTo(x + boundedRadius, y);
  context.lineTo(x + width - boundedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + boundedRadius);
  context.lineTo(x + width, y + height - boundedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - boundedRadius, y + height);
  context.lineTo(x + boundedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius);
  context.lineTo(x, y + boundedRadius);
  context.quadraticCurveTo(x, y, x + boundedRadius, y);
  context.closePath();
};

const parsePngDimensions = (png: Uint8Array) => {
  const signature = Array.from(png.subarray(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  if (signature !== PNG_SIGNATURE) throw new Error(i18n.t('brandingGenerator.errors.invalidPng'));

  const headerType = new TextDecoder().decode(png.subarray(12, 16));
  if (headerType !== 'IHDR') throw new Error(i18n.t('brandingGenerator.errors.invalidPngHeader'));

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);

  return { width, height };
};

const createIco = (pngs: Uint8Array[]): Uint8Array => {
  const iconCount = pngs.length;
  const headerSize = 6 + iconCount * 16;
  let offset = headerSize;
  const totalSize = headerSize + pngs.reduce((sum, png) => sum + png.length, 0);

  const result = new Uint8Array(totalSize);
  const view = new DataView(result.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, iconCount, true);

  pngs.forEach((png, index) => {
    const { width, height } = parsePngDimensions(png);
    const start = 6 + index * 16;
    result[start] = width >= 256 ? 0 : width;
    result[start + 1] = height >= 256 ? 0 : height;
    result[start + 2] = 0;
    result[start + 3] = 0;
    view.setUint16(start + 4, 1, true);
    view.setUint16(start + 6, 32, true);
    view.setUint32(start + 8, png.length, true);
    view.setUint32(start + 12, offset, true);
    result.set(png, offset);
    offset += png.length;
  });

  return result;
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(i18n.t('brandingGenerator.errors.imageLoadFailed')));
    };
    image.src = url;
  });

const normalizeImageToPng = async (image: HTMLImageElement): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.width);
  canvas.height = Math.max(1, image.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error(i18n.t('brandingGenerator.errors.canvasUnavailable'));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToPngBytes(canvas);
};

const renderIcon = async ({
  image,
  size,
  backgroundMode,
  roundedCorners,
  cornerRadiusPercent,
}: RenderIconInput): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(i18n.t('brandingGenerator.errors.canvasUnavailable'));

  context.clearRect(0, 0, size, size);

  const chipFill = backgroundFillByMode[backgroundMode];
  const chipSize = Math.round(size * CHIP_SCALE);
  const chipStart = Math.round((size - chipSize) / 2);
  const boundedPercent = Math.max(0, Math.min(cornerRadiusPercent, 100));
  const cornerRadius = roundedCorners ? (chipSize * boundedPercent) / 200 : 0;

  if (chipFill) {
    context.fillStyle = chipFill;
    drawRoundedRect(context, chipStart, chipStart, chipSize, chipSize, roundedCorners ? cornerRadius : 0);
    context.fill();
  }

  const targetFrame = chipFill ? chipSize : size;
  const targetSize = Math.round(targetFrame * PREFERRED_ICON_PADDING);
  const ratio = Math.min(targetSize / image.width, targetSize / image.height);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const x = Math.round((size - width) / 2);
  const y = Math.round((size - height) / 2);

  context.drawImage(image, x, y, width, height);

  return canvasToPngBytes(canvas);
};

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const toUint16LE = (value: number) => value & 0xffff;
const toUint32LE = (value: number) => value >>> 0;

const getDosDateTime = (input?: Date): { date: number; time: number } => {
  const value = input ?? new Date();
  const year = Math.max(value.getFullYear(), 1980);
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const seconds = Math.floor(value.getSeconds() / 2);
  const date = ((year - 1980) << 9) | (month << 5) | day;
  const time = (hours << 11) | (minutes << 5) | seconds;
  return { date: toUint16LE(date), time: toUint16LE(time) };
};

const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
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

  const [smallLogoPng, bigLogoPng, icon512, icon192, appleTouchIcon] = await Promise.all([
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

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const createPngObjectUrl = (pngBytes: Uint8Array): string =>
  URL.createObjectURL(new Blob([new Uint8Array(pngBytes).buffer], { type: 'image/png' }));

export const createZipBlob = (entries: ZipEntry[]): Blob => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.path);
    const { date, time } = getDosDateTime(entry.modifiedAt);
    const checksum = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, toUint32LE(checksum), true);
    localView.setUint32(18, toUint32LE(size), true);
    localView.setUint32(22, toUint32LE(size), true);
    localView.setUint16(26, toUint16LE(nameBytes.length), true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, entry.data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, toUint32LE(checksum), true);
    centralView.setUint32(20, toUint32LE(size), true);
    centralView.setUint32(24, toUint32LE(size), true);
    centralView.setUint16(28, toUint16LE(nameBytes.length), true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, toUint32LE(offset), true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.data.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, toUint16LE(entries.length), true);
  endView.setUint16(10, toUint16LE(entries.length), true);
  endView.setUint32(12, toUint32LE(centralSize), true);
  endView.setUint32(16, toUint32LE(offset), true);
  endView.setUint16(20, 0, true);

  const blobParts = [...localParts, ...centralParts, endRecord].map(toArrayBuffer);

  return new Blob(blobParts, {
    type: 'application/zip',
  });
};
