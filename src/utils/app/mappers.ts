import { ApiKeys, FeatureType } from '@/types/common';

export class EnumMapper {
  public static getApiKeyByFeatureType = (featureType: FeatureType) => {
    switch (featureType) {
      case FeatureType.Chat:
        return ApiKeys.Conversations;
      case FeatureType.File:
      default:
        return ApiKeys.Files;
    }
  };

  public static getFeatureTypeByApiKey = (apiKey: ApiKeys) => {
    switch (apiKey) {
      case ApiKeys.Conversations:
        return FeatureType.Chat;
      case ApiKeys.Applications:
        return FeatureType.Application;
      case ApiKeys.Files:
      default:
        return FeatureType.File;
    }
  };
}
