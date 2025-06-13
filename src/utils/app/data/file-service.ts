import { map, Observable } from 'rxjs';

import { ApiKeys } from '@/types/common';
import { BackendFile, DialFile } from '@/types/files';
import { HTTPMethod } from '@/types/http';

import { ApiUtils } from '../../server/api';
import { constructPath } from '../file';

export class FileService {
  public static sendFile(
    formData: FormData,
    relativePath: string | undefined,
    fileName: string,
    httpMethod?: HTTPMethod,
  ): Observable<{ percent?: number; result?: DialFile }> {
    const resultPath = ApiUtils.encodeApiUrl(constructPath(relativePath, fileName));

    return ApiUtils.requestOld({
      url: `/api/${resultPath}`,
      method: httpMethod ? httpMethod : HTTPMethod.POST,
      async: true,
      body: formData,
    }).pipe(
      map(({ percent, result }: { percent?: number; result?: unknown }): { percent?: number; result?: DialFile } => {
        if (percent) {
          return { percent };
        }

        if (!result) {
          return {};
        }

        const typedResult = result as BackendFile;
        const relativePath = typedResult.parentPath ? ApiUtils.decodeApiUrl(typedResult.parentPath) : undefined;

        return {
          result: {
            id: ApiUtils.decodeApiUrl(typedResult.url),
            name: typedResult.name,
            absolutePath: constructPath(ApiKeys.Files, typedResult.bucket, relativePath),
            relativePath: relativePath,
            folderId: constructPath(ApiKeys.Files, typedResult.bucket, relativePath),
            contentLength: typedResult.contentLength,
            contentType: typedResult.contentType,
            serverSynced: true,
          },
        };
      }),
    );
  }

  public static deleteFile(filePath: string): Observable<void> {
    return ApiUtils.request(`/api/${ApiUtils.encodeApiUrl(filePath)}`, {
      method: HTTPMethod.DELETE,
    });
  }
}
