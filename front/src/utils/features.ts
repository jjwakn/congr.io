import type { SxProps, Theme } from '@mui/material';
import type { Feature } from '@/types/feature.types';
import type { ToggleFeatureSelectionProps } from './features.types';

export const getFeatureChildren = (features: Feature[], parentId: string) =>
  features.filter(({ parent }) => parent === parentId);

export const getFeatureDescendantIds = (features: Feature[], featureId: string): string[] =>
  getFeatureChildren(features, featureId).flatMap((child) => [
    child.id,
    ...getFeatureDescendantIds(features, child.id),
  ]);

export const getRootFeatures = (features: Feature[]) => features.filter(({ parent }) => !parent);

export const normalizeSelectedFeatures = (features: Feature[], selected: string[]) => {
  const next = new Set(selected);

  features
    .filter(({ required }) => required)
    .forEach(({ id }) => {
      next.add(id);
    });

  let changed = true;
  while (changed) {
    changed = false;
    Array.from(next).forEach((id) => {
      const feature = features.find(({ id: candidateId }) => candidateId === id);
      feature?.prerequisites?.forEach((prerequisiteId) => {
        if (!next.has(prerequisiteId)) changed = true;
        next.add(prerequisiteId);
      });
    });
  }

  return features.filter(({ id }) => next.has(id)).map(({ id }) => id);
};

export const toggleFeatureSelection = ({ features, selected, featureId, checked }: ToggleFeatureSelectionProps) => {
  const next = new Set(selected);
  const feature = features.find(({ id }) => id === featureId);
  const descendants = getFeatureDescendantIds(features, featureId);

  if (checked) {
    [featureId, ...descendants].forEach((id) => next.add(id));
    [feature, ...features.filter(({ id }) => descendants.includes(id))].forEach((currentFeature) => {
      currentFeature?.prerequisites?.forEach((id) => next.add(id));
    });
  } else {
    const removeWithDependents = (id: string) => {
      next.delete(id);
      getFeatureDescendantIds(features, id).forEach((descendantId) => next.delete(descendantId));
      features
        .filter(({ prerequisites }) => prerequisites?.includes(id))
        .forEach(({ id: dependentId }) => removeWithDependents(dependentId));
    };
    removeWithDependents(featureId);
  }

  return normalizeSelectedFeatures(features, Array.from(next));
};

export const isFeaturePartiallySelected = (features: Feature[], selected: string[], featureId: string) => {
  const children = getFeatureDescendantIds(features, featureId);
  if (!children.length || !selected.includes(featureId)) return false;

  return children.some((id) => !selected.includes(id));
};

export const PARTIAL_FEATURE_SWITCH_SX: SxProps<Theme> = {
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: 'warning.main',
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: 'warning.main',
  },
};
