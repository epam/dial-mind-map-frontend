import { of, throwError } from 'rxjs';

import { ApiKeys, Entity, UploadStatus } from '@/types/common';
import { HTTPMethod } from '@/types/http';
import { ApiUtils } from '@/utils/server/api';

import { ApiEntityStorage } from '../api-entity-storage';

jest.mock('@/utils/server/api', () => {
  const request = jest.fn();
  return {
    ApiUtils: {
      encodeApiUrl: jest.fn(url => url),
      decodeApiUrl: jest.fn(url => url),
      request,
    },
    request,
  };
});

describe('ApiEntityStorage', () => {
  interface TestEntity extends Entity {
    name: string;
  }

  class TestStorage extends ApiEntityStorage<TestEntity, TestEntity> {
    getEntityKey(info: TestEntity) {
      return info.id;
    }
    parseEntityKey(key: string) {
      return { id: key, name: 'Parsed Entity' };
    }
    getStorageKey(): ApiKeys {
      return ApiKeys.Test;
    }
    cleanUpEntity(entity: TestEntity) {
      return entity;
    }
    mergeGetResult(info: TestEntity, entity: TestEntity) {
      return { ...info, ...entity };
    }
  }

  const storage = new TestStorage();
  const mockEntity: TestEntity = { id: '123', name: 'Test Entity' };

  test('getEntities should return mapped entities', done => {
    (ApiUtils.request as jest.Mock).mockReturnValue(of([{ name: 'Entity1', url: '123', updatedAt: '2024-01-01' }]));
    storage.getEntities().subscribe(entities => {
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('123');
      done();
    });
  });

  test('getEntity should return entity with status LOADED', done => {
    (ApiUtils.request as jest.Mock).mockReturnValue(of(mockEntity));
    storage.getEntity(mockEntity).subscribe(entity => {
      expect(entity?.id).toBe('123');
      expect(entity?.status).toBe(UploadStatus.LOADED);
      done();
    });
  });

  test('updateEntity should send PUT request', done => {
    (ApiUtils.request as jest.Mock).mockReturnValue(of(mockEntity));
    storage.updateEntity(mockEntity).subscribe(entity => {
      expect(ApiUtils.request).toHaveBeenCalledWith('api/123', expect.objectContaining({ method: HTTPMethod.PUT }));
      expect(entity).toEqual(mockEntity);
      done();
    });
  });

  test('createEntity should send POST request', done => {
    (ApiUtils.request as jest.Mock).mockReturnValue(of(mockEntity));
    storage.createEntity(mockEntity).subscribe(entity => {
      expect(ApiUtils.request).toHaveBeenCalledWith('api/123', expect.objectContaining({ method: HTTPMethod.POST }));
      expect(entity.status).toBe(UploadStatus.LOADED);
      done();
    });
  });

  test('getListingUrl should return correct URL without query params', () => {
    const url = storage['getListingUrl']({ path: 'testPath' });
    expect(url).toBe('/api/listing/testPath');
  });

  test('getListingUrl should return correct URL with query params', () => {
    const url = storage['getListingUrl']({ path: 'testPath', resultQuery: 'filter=item' });
    expect(url).toBe('/api/listing/testPath?filter=item');
  });

  test('handles errors gracefully', done => {
    (ApiUtils.request as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));
    storage.getEntity(mockEntity).subscribe({
      error: err => {
        expect(err).toEqual(new Error('API Error'));
        done();
      },
    });
  });
});
