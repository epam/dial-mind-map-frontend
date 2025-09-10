import { UnknownAction } from '@reduxjs/toolkit';
import { catchError, concat, defer, filter, forkJoin, from, map, of, switchMap, take, withLatestFrom } from 'rxjs';

import { StorageType } from '@/types/storage';
import { ChatRootEpic } from '@/types/store';
import { getConversationInfoFromId, getLocalConversationInfo } from '@/utils/app/conversation';
import { ConversationService } from '@/utils/app/data/conversation-service';
import { DataService } from '@/utils/app/data/data-service';

import { AppearanceActions } from '../../appearance/appearance.reducers';
import { ApplicationActions, ApplicationSelectors } from '../../application/application.reducer';
import { BucketActions } from '../../bucket/bucket.reducer';
import { MindmapActions } from '../../mindmap/mindmap.reducers';
import { PlaybackActions } from '../../playback/playback.reducer';
import { PlaybackSelectors } from '../../playback/playback.selectors';
import { ChatUISelectors } from '../../ui/ui.reducers';
import { ConversationActions } from '../conversation.reducers';

export const initEpic: ChatRootEpic = (action$, state$) =>
  action$.pipe(
    filter(ConversationActions.init.match),

    switchMap(({ payload }) => {
      return concat(
        of(BucketActions.fetchBucketStart()).pipe(),

        action$.pipe(
          filter(BucketActions.fetchBucketSuccess.match),
          take(1),
          withLatestFrom(state$),
          switchMap(([, stateAfterBuckets]) => {
            const application = ApplicationSelectors.selectApplication(stateAfterBuckets);

            return concat(
              defer(() =>
                application
                  ? of(ApplicationActions.fetchApplicationSuccess(application))
                  : of(ApplicationActions.fetchApplicationStart(payload.applicationId)),
              ),
              action$.pipe(
                filter(ApplicationActions.fetchApplicationSuccess.match),
                take(1),
                withLatestFrom(state$),
                switchMap(([, state]) => {
                  const isAllowApiKey = ChatUISelectors.selectIsAllowApiKey(state);
                  const application = ApplicationSelectors.selectApplication(state);

                  // If API key is allowed, we need to initialize DataService with BrowserStorage
                  if (isAllowApiKey) {
                    DataService.init(StorageType.BrowserStorage);
                  }

                  const conversationInfo = isAllowApiKey
                    ? getLocalConversationInfo(application)
                    : getConversationInfoFromId(payload.conversationId);

                  const independentActions = forkJoin({
                    themeConfig: of(AppearanceActions.initTheme()),
                    mindmap: of(MindmapActions.fetchGraph()),
                    getConversations: of(ConversationActions.getConversations()),
                    subscribe: of(ApplicationActions.subscribe()),
                  });

                  const conversationAction =
                    (conversationInfo.bucket !== 'local' && payload.conversationId) ||
                    conversationInfo.bucket === 'default-bucket'
                      ? ConversationService.getConversation(conversationInfo).pipe(
                          map(conversation =>
                            conversation ? ConversationActions.initConversation(conversation) : null,
                          ),
                          catchError(() => {
                            console.warn("Can't retrieve conversation");
                            return of(null);
                          }),
                        )
                      : of(null);

                  return forkJoin({ independent: independentActions, conversation: conversationAction }).pipe(
                    switchMap(({ independent, conversation }) => {
                      const hasAppProperties = ApplicationSelectors.selectHasAppProperties(state);
                      const actions: UnknownAction[] = [
                        independent.themeConfig,
                        independent.getConversations,
                        independent.subscribe,
                      ];

                      if (hasAppProperties) {
                        actions.unshift(independent.mindmap);
                      }

                      if (conversation) {
                        actions.unshift(conversation);

                        const isPlayback = PlaybackSelectors.selectIsPlayback(state);
                        if (isPlayback) {
                          actions.unshift(PlaybackActions.init(conversation.payload));
                        }
                      }
                      return from(actions);
                    }),
                  );
                }),
              ),
            );
          }),
        ),
      );
    }),
  );
