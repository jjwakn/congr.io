import { I18nService } from 'nestjs-i18n';
import { FeatureTree } from 'src/utils/constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureService {
  constructor(private readonly i18n: I18nService) {}

  list() {
    return Object.keys(FeatureTree).map((feature) => ({
      id: feature,
      required: FeatureTree[feature].required,
      prerequisites: FeatureTree[feature].prerequisites,
      title: this.i18n.t(`features.${feature}.title`),
      description: this.i18n.t(`features.${feature}.description`),
    }));
  }
}
