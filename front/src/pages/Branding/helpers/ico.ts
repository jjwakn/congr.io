const PNG_SIGNATURE = '89504e470d0a1a0a';

const parsePngDimensions = (png: Uint8Array) => {
  const signature = Array.from(png.subarray(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  if (signature !== PNG_SIGNATURE)
    throw new Error('Invalid PNG provided for favicon generation');

  const headerType = new TextDecoder().decode(png.subarray(12, 16));
  if (headerType !== 'IHDR')
    throw new Error('Invalid PNG IHDR chunk for favicon generation');

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);

  return { width, height };
};

export const createIco = (pngs: Uint8Array[]): Uint8Array => {
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
