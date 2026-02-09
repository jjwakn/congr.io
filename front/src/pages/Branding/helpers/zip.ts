export type ZipEntry = {
  path: string;
  data: Uint8Array;
  modifiedAt?: Date;
};

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

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
};

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

  const blobParts = [...localParts, ...centralParts, endRecord].map(
    toArrayBuffer,
  );

  return new Blob(blobParts, {
    type: 'application/zip',
  });
};
