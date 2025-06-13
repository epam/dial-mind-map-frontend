import { LOCAL_BUCKET } from '@/constants/settings';
import { ApiKeys, FeatureType } from '@/types/common';

import { BucketService } from './data/bucket-service';
import { constructPath } from './file';
import { splitEntityId } from './folders';
import { EnumMapper } from './mappers';

export const getRootId = ({ featureType, id, bucket }: { featureType: FeatureType; id?: string; bucket?: string }) => {
  const splittedEntityId = id ? splitEntityId(id) : undefined;

  return constructPath(
    splittedEntityId?.apiKey ?? EnumMapper.getApiKeyByFeatureType(featureType),
    splittedEntityId?.bucket ?? bucket ?? BucketService.getBucket(),
  );
};

export const getConversationRootId = (bucket?: string) => getRootId({ bucket, featureType: FeatureType.Chat });

export const isConversationId = (id?: string) => id?.startsWith(`${ApiKeys.Conversations}/`);

export const getEntityBucket = (entity: { id: string }) => decodeURIComponent(entity.id).split('/')[1];

export const isEntityIdLocal = (entity: { id: string }) => getEntityBucket(entity) === LOCAL_BUCKET;
export const getFileRootId = (bucket?: string) => getRootId({ featureType: FeatureType.File, bucket });
