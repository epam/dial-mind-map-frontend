import { UnknownAction } from 'redux';
import { catchError, concat, concatMap, EMPTY, map, Observable, of, throwError } from 'rxjs';

import { parseSSEStream } from '@/utils/app/streams';

import { BuilderActions } from '../../builder.reducers';

export function handleMindmapGenerationStream(resp: Response, controller: AbortController): Observable<UnknownAction> {
  if (!resp.body) {
    return throwError(() => new Error('ReadableStream not supported'));
  }

  const reader = resp.body.getReader();
  const eventObservable = parseSSEStream(reader, controller);

  return eventObservable.pipe(
    map(data => {
      const parsedData = JSON.parse(data as string);

      if (parsedData.time) {
        const messageTimeMs = parsedData.time * 1000;
        const currentTimeMs = Date.now();
        const timeDiff = currentTimeMs - messageTimeMs;
        if (parsedData.error || timeDiff > 3 * 60 * 1000) {
          return {
            isComplete: false,
            statusAction: BuilderActions.setGeneratingStatus({
              isError: true,
              title: 'Graph generation error',
              details: parsedData.user_friendly ? parsedData.error : undefined,
            }),
          };
        }
      }

      if (parsedData.etag) {
        return { isComplete: true };
      } else if (parsedData.error) {
        return {
          isComplete: false,
          statusAction: BuilderActions.setGeneratingStatus({
            isError: true,
            title: 'Graph generation error',
            details: parsedData.user_friendly ? parsedData.error : undefined,
          }),
        };
      } else {
        return {
          isComplete: false,
          statusAction: BuilderActions.setGeneratingStatus(parsedData),
        };
      }
    }),
    concatMap(({ isComplete, statusAction }) => {
      if (isComplete) {
        return concat(of(BuilderActions.generationComplete()));
      } else if (statusAction) {
        return of(statusAction);
      }
      return EMPTY;
    }),
    catchError(error => {
      console.warn('SSE processing error:', error);
      return EMPTY;
    }),
  );
}
