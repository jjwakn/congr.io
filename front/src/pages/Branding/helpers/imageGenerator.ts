import i18n from '../../../../i18n';
import { BackgroundMode } from '../types';

const PREFERRED_ICON_PADDING = 0.7;
const CHIP_SCALE = 0.88;

const backgroundFillByMode: Record<BackgroundMode, string | null> = {
  transparent: null,
  white: '#ffffff',
  black: '#000000',
};

const canvasToPngBytes = async (
  canvas: HTMLCanvasElement,
): Promise<Uint8Array> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(
          new Error(i18n.t('brandingGenerator.errors.pngGenerationFailed')),
        );
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
  const boundedRadius = Math.max(
    0,
    Math.min(radius, Math.min(width, height) / 2),
  );
  context.beginPath();
  context.moveTo(x + boundedRadius, y);
  context.lineTo(x + width - boundedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + boundedRadius);
  context.lineTo(x + width, y + height - boundedRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - boundedRadius,
    y + height,
  );
  context.lineTo(x + boundedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius);
  context.lineTo(x, y + boundedRadius);
  context.quadraticCurveTo(x, y, x + boundedRadius, y);
  context.closePath();
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
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

export const normalizeImageToPng = async (
  image: HTMLImageElement,
): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.width);
  canvas.height = Math.max(1, image.height);
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error(i18n.t('brandingGenerator.errors.canvasUnavailable'));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToPngBytes(canvas);
};

export const renderIcon = async ({
  image,
  size,
  backgroundMode,
  roundedCorners,
  cornerRadiusPercent,
}: {
  image: HTMLImageElement;
  size: number;
  backgroundMode: BackgroundMode;
  roundedCorners: boolean;
  cornerRadiusPercent: number;
}): Promise<Uint8Array> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error(i18n.t('brandingGenerator.errors.canvasUnavailable'));

  context.clearRect(0, 0, size, size);

  const chipFill = backgroundFillByMode[backgroundMode];
  const chipSize = Math.round(size * CHIP_SCALE);
  const chipStart = Math.round((size - chipSize) / 2);
  const boundedPercent = Math.max(0, Math.min(cornerRadiusPercent, 100));
  const cornerRadius = roundedCorners ? (chipSize * boundedPercent) / 200 : 0;

  if (chipFill) {
    context.fillStyle = chipFill;
    drawRoundedRect(
      context,
      chipStart,
      chipStart,
      chipSize,
      chipSize,
      roundedCorners ? cornerRadius : 0,
    );
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

export const createPngObjectUrl = (pngBytes: Uint8Array): string =>
  URL.createObjectURL(
    new Blob([new Uint8Array(pngBytes).buffer], { type: 'image/png' }),
  );
