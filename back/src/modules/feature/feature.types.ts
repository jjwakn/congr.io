import { Feature } from 'src/utils/constants';

export type FeatureTreeType = {
  [key in Feature]: { parent?: Feature; required?: boolean; prerequisites: Feature[] };
};
