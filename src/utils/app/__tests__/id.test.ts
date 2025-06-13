import { LOCAL_BUCKET } from '@/constants/settings';
import { ApiKeys, FeatureType } from '@/types/common';

import { BucketService } from '../data/bucket-service';
import { constructPath } from '../file';
import { splitEntityId } from '../folders';
import {
  getConversationRootId,
  getEntityBucket,
  getFileRootId,
  getRootId,
  isConversationId,
  isEntityIdLocal,
} from '../id';
import { EnumMapper } from '../mappers';

jest.mock('../folders', () => ({
  splitEntityId: jest.fn(),
}));

jest.mock('../file', () => ({
  constructPath: jest.fn((...args) => args.join('/')),
}));

jest.mock('../mappers', () => ({
  EnumMapper: {
    getApiKeyByFeatureType: jest.fn(featureType => `mockApiKey-${featureType}`),
  },
}));

jest.mock('../data/bucket-service', () => ({
  BucketService: {
    getBucket: jest.fn(() => 'default-bucket'),
  },
}));

describe('getRootId', () => {
  it('should construct root id from splitEntityId when id is provided', () => {
    (splitEntityId as jest.Mock).mockReturnValue({
      apiKey: 'mock-api-key',
      bucket: 'mock-bucket',
    });

    const result = getRootId({ featureType: FeatureType.Chat, id: 'mock-id' });

    expect(result).toBe('mock-api-key/mock-bucket');
    expect(constructPath).toHaveBeenCalledWith('mock-api-key', 'mock-bucket');
  });

  it('should fallback to EnumMapper and BucketService when id is not provided', () => {
    const result = getRootId({ featureType: FeatureType.File });

    expect(result).toBe('mockApiKey-file/default-bucket');
    expect(EnumMapper.getApiKeyByFeatureType).toHaveBeenCalledWith(FeatureType.File);
    expect(BucketService.getBucket).toHaveBeenCalled();
  });

  it('should use provided bucket when id is not provided', () => {
    const result = getRootId({ featureType: FeatureType.File, bucket: 'custom-bucket' });

    expect(result).toBe('mockApiKey-file/custom-bucket');
  });

  it('should use bucket from splitEntityId when id is provided', () => {
    (splitEntityId as jest.Mock).mockReturnValue({
      apiKey: 'mock-api-key',
      bucket: 'mock-bucket',
    });

    const result = getRootId({ featureType: FeatureType.File, id: 'mock-id', bucket: 'ignored-bucket' });

    expect(result).toBe('mock-api-key/mock-bucket');
  });
});

describe('getConversationRootId', () => {
  it('should return root id for conversation feature', () => {
    const result = getConversationRootId('conv-bucket');

    expect(result).toBe('mockApiKey-chat/conv-bucket');
  });

  it('should use default bucket when not provided', () => {
    const result = getConversationRootId();

    expect(result).toBe('mockApiKey-chat/default-bucket');
  });
});

describe('isConversationId', () => {
  it('should return true if id starts with ApiKeys.Conversations', () => {
    expect(isConversationId(`${ApiKeys.Conversations}/123`)).toBe(true);
  });

  it('should return false if id does not start with ApiKeys.Conversations', () => {
    expect(isConversationId('some-other-id')).toBe(false);
  });

  it('should return undefined if id is undefined', () => {
    expect(isConversationId()).toBe(undefined);
  });
});

describe('getEntityBucket', () => {
  it('should return the bucket from the entity id', () => {
    expect(getEntityBucket({ id: 'some-api-key/some-bucket/entity-name' })).toBe('some-bucket');
  });

  it('should return undefined if id format is incorrect', () => {
    expect(getEntityBucket({ id: 'invalid-id' })).toBe(undefined);
  });
});

describe('isEntityIdLocal', () => {
  it('should return true if entity bucket matches LOCAL_BUCKET', () => {
    expect(isEntityIdLocal({ id: `some-api-key/${LOCAL_BUCKET}/entity-name` })).toBe(true);
  });

  it('should return false if entity bucket does not match LOCAL_BUCKET', () => {
    expect(isEntityIdLocal({ id: 'some-api-key/remote-bucket/entity-name' })).toBe(false);
  });
});

describe('getFileRootId', () => {
  it('should return root id for file feature', () => {
    const result = getFileRootId('file-bucket');

    expect(result).toBe('mockApiKey-file/file-bucket');
  });

  it('should use default bucket when not provided', () => {
    const result = getFileRootId();

    expect(result).toBe('mockApiKey-file/default-bucket');
  });
});
