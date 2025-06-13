import { map, Observable, throwError } from 'rxjs';

import { ApiKeys, BackendChatEntity, BackendDataNodeType, Entity, UploadStatus } from '@/types/common';
import { HTTPMethod } from '@/types/http';
import { EntityStorage } from '@/types/storage';
import { constructPath } from '@/utils/app/file';
import { splitEntityId } from '@/utils/app/folders';
import { getRootId } from '@/utils/app/id';
import { EnumMapper } from '@/utils/app/mappers';
import { ApiUtils } from '@/utils/server/api';

export abstract class ApiEntityStorage<
  TEntityInfo extends Entity,
  TEntity extends TEntityInfo,
  APIResponse = TEntity,
  APIModel = APIResponse,
> implements EntityStorage<TEntityInfo, TEntity>
{
  private getEntityUrl = (entity: TEntityInfo): string => ApiUtils.encodeApiUrl(constructPath('api', entity.id));

  private getListingUrl = ({ path, resultQuery }: { path?: string; resultQuery?: string }): string => {
    const listingUrl =
      '/' +
      ApiUtils.encodeApiUrl(
        constructPath(
          'api/listing',
          path || getRootId({ featureType: EnumMapper.getFeatureTypeByApiKey(this.getStorageKey()) }),
        ),
      );
    return resultQuery ? `${listingUrl}?${resultQuery}` : listingUrl;
  };

  private mapEntity(entity: BackendChatEntity): TEntityInfo {
    const info = this.parseEntityKey(entity.name);
    const id = ApiUtils.decodeApiUrl(entity.url);
    const { apiKey, bucket, parentPath } = splitEntityId(id);

    return {
      ...info,
      id,
      lastActivityDate: entity.updatedAt,
      folderId: constructPath(apiKey, bucket, parentPath),
    } as unknown as TEntityInfo;
  }

  getEntities(path?: string, recursive?: boolean): Observable<TEntityInfo[]> {
    const filter = BackendDataNodeType.ITEM;

    const query = new URLSearchParams({
      filter,
      ...(recursive && { recursive: String(recursive) }),
    });
    const resultQuery = query.toString();

    return ApiUtils.request(this.getListingUrl({ path, resultQuery })).pipe(
      map((entities: BackendChatEntity[]) => {
        const mappedEntities = entities.map(entity => this.mapEntity(entity));
        return mappedEntities;
      }),
    );
  }

  getEntity(info: TEntityInfo): Observable<TEntity | null> {
    try {
      return ApiUtils.request(this.getEntityUrl(info)).pipe(
        map((entity: APIResponse) => {
          return {
            ...this.mergeGetResult(info, entity),
            status: UploadStatus.LOADED,
          };
        }),
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  updateEntity(entity: TEntity): Observable<TEntity> {
    try {
      return ApiUtils.request(this.getEntityUrl(entity), {
        method: HTTPMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...this.cleanUpEntity(entity), assistantModelId: 'anthropic.claude-v3-sonnet' }),
      });
    } catch (error) {
      return throwError(() => error);
    }
  }

  createEntity(entity: TEntity): Observable<TEntity> {
    try {
      return ApiUtils.request(this.getEntityUrl(entity), {
        method: HTTPMethod.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...this.cleanUpEntity(entity), assistantModelId: 'anthropic.claude-v3-sonnet' }),
      }).pipe(
        map((response: APIResponse) => {
          return {
            ...this.mergeGetResult(entity, response),
            status: UploadStatus.LOADED,
          };
        }),
      );
    } catch (error) {
      return throwError(() => error);
    }
  }

  abstract getEntityKey(info: TEntityInfo): string;

  abstract parseEntityKey(key: string): Omit<TEntityInfo, 'folderId' | 'id'>;

  abstract getStorageKey(): ApiKeys;

  abstract cleanUpEntity(entity: TEntity): APIModel;

  abstract mergeGetResult(info: TEntityInfo, entity: APIResponse): TEntity;
}
