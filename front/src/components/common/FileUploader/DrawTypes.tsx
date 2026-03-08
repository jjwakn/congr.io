import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const DrawTypes = ({ types, minSize, maxSize }: { types?: Array<string>; minSize?: number; maxSize?: number }): null | ReactNode => {
  const { t } = useTranslation();

  if (types) {
    const stringTypes = types.toString();
    const tooltipParts: string[] = [];

    if (maxSize) {
      tooltipParts.push(t('components.fileUploader.tooltip.maxSize', { size: maxSize }));
    }

    if (minSize) {
      tooltipParts.push(t('components.fileUploader.tooltip.minSize', { size: minSize }));
    }

    tooltipParts.push(t('components.fileUploader.tooltip.types', { types: stringTypes }));

    return (
      <span title={tooltipParts.join(', ')} className="file-types">
        {stringTypes}
      </span>
    );
  }
  return null;
};

export default DrawTypes;
