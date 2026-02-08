import { ReactNode } from 'react';

export default function DrawTypes({
  types,
  minSize,
  maxSize,
}: {
  types?: Array<string>;
  minSize?: number;
  maxSize?: number;
}): null | ReactNode {
  if (types) {
    const stringTypes = types.toString();
    let size = '';
    if (maxSize) size += `size >= ${maxSize}, `;
    if (minSize) size += `size <= ${minSize}, `;
    return (
      <span title={`${size}types: ${stringTypes}`} className="file-types">
        {stringTypes}
      </span>
    );
  }
  return null;
}
