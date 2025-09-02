import { Feature } from 'src/utils/constants';

export type FeatureTreeType = {
  [key in Feature]: { required?: boolean; prerequisites: Feature[] };
};
