export const getFileSizeMB = (size: number): number => {
  return size / 1000 / 1000;
};

export const checkType = ({
  file,
  types,
}: {
  file: File;
  types: string[];
}): boolean => {
  const extension: string = file.name.split('.').pop() as string;
  const loweredTypes = types.map((type) => type.toLowerCase());
  return loweredTypes.includes(extension.toLowerCase());
};

export const acceptedExt = (types: string[] | undefined) => {
  if (types === undefined) return '';
  return types.map((type) => `.${type.toLowerCase()}`).join(',');
};
