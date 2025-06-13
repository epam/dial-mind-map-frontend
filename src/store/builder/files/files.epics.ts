import { Action } from '@reduxjs/toolkit';
import cloneDeep from 'lodash-es/cloneDeep';
import { combineEpics } from 'redux-observable';
import { catchError, concat, EMPTY, filter, ignoreElements, map, mergeMap, of, take, takeUntil } from 'rxjs';

import { Node } from '@/types/graph';
import { BuilderRootEpic } from '@/types/store';
import { FileService } from '@/utils/app/data/file-service';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { BuilderActions } from '../builder/builder.reducers';
import { GraphSelectors } from '../graph/graph.reducers';
import { UIActions } from '../ui/ui.reducers';
import { checkForUnauthorized } from '../utils/checkForUnauthorized';
import { globalCatchUnauthorized } from '../utils/globalCatchUnauthorized';
import { FilesActions, FilesSelectors } from './files.reducers';

const uploadFileEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(FilesActions.uploadFile.match),
    mergeMap(({ payload }) => {
      const formData = new FormData();
      formData.append('attachment', payload.fileContent, payload.name);

      return FileService.sendFile(formData, payload.relativePath, payload.name).pipe(
        filter(({ percent, result }) => typeof percent !== 'undefined' || typeof result !== 'undefined'),
        map(({ percent, result }) => {
          if (result) {
            return FilesActions.uploadFileSuccess({
              apiResult: result,
            });
          }

          return FilesActions.uploadFileTick({
            id: payload.id,
            percent: percent!,
          });
        }),
        takeUntil(
          action$.pipe(
            filter(FilesActions.uploadFileCancel.match),
            filter(action => action.payload.id === payload.id),
          ),
        ),
        catchError(error => checkForUnauthorized(error)),
        globalCatchUnauthorized(),
        catchError(() => {
          return of(FilesActions.uploadFileFail({ id: payload.id }));
        }),
      );
    }),
  );

const replaceIconEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(FilesActions.replaceIcon.match),
    mergeMap(({ payload }) => {
      const uploadFileAction = FilesActions.uploadFile({
        fileContent: payload.fileContent,
        name: payload.name,
        relativePath: payload.relativePath,
        id: payload.id,
      });
      const {
        iconPath,
        nodeId,
        iconNameToReplace: previousIconName,
        iconFileIdToReplace: previousIconFileId,
      } = payload;

      return concat(
        of(uploadFileAction),
        action$.pipe(
          filter(FilesActions.uploadFileSuccess.match),
          filter(action => action.payload.apiResult.id === payload.id),
          take(1),
          mergeMap(() => {
            const elements = GraphSelectors.selectElements(state$.value);
            const targetNode = elements.find(el => el.data.id === nodeId)?.data as Node;
            if (!targetNode) {
              return EMPTY;
            }

            const updatedNode = cloneDeep(targetNode);
            updatedNode.icon = iconPath;

            const actions: Action[] = [BuilderActions.updateNode(updatedNode)];

            if (previousIconFileId && previousIconName) {
              actions.push(FilesActions.deleteIcon({ fileId: previousIconFileId, fileName: previousIconName }));
            }

            return concat(actions);
          }),
        ),
      );
    }),
  );

export const deleteFileEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(FilesActions.deleteFile.match),
    mergeMap(({ payload }) => {
      const file = FilesSelectors.selectFiles(state$.value).find(file => file.id === payload.fileId);

      if (file && !file.serverSynced) {
        return concat(
          of(
            FilesActions.uploadFileCancel({
              id: payload.fileId,
            }),
          ),
          of(
            FilesActions.deleteFileSuccess({
              fileId: payload.fileId,
            }),
          ),
        );
      }

      return FileService.deleteFile(payload.fileId).pipe(
        mergeMap(() =>
          of(
            FilesActions.deleteFileSuccess({
              fileId: payload.fileId,
            }),
          ),
        ),
        globalCatchUnauthorized(),
        catchError(() =>
          of(
            FilesActions.deleteFileFail({
              fileName: file?.name ?? payload.fileName,
            }),
          ),
        ),
      );
    }),
  );

export const deleteIconEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(FilesActions.deleteIcon.match),
    mergeMap(({ payload }) => {
      const icons = GraphSelectors.selectElements(state$.value).reduce<string[]>((acc, el) => {
        const node = el.data as Node;
        if (!isEdge(node) && node.icon) {
          acc.push(node.icon);
        }
        return acc;
      }, []);

      if (icons.filter(icon => icon.includes(payload.fileName)).length > 1) {
        return EMPTY;
      }

      return of(FilesActions.deleteFile(payload));
    }),
  );

const deleteFileFailEpic: BuilderRootEpic = action$ =>
  action$.pipe(
    filter(FilesActions.deleteFileFail.match),
    map(({ payload }) => {
      return UIActions.showToast({
        message: `Deleting file ${payload.fileName} failed. Please try again later`,
      });
    }),
    ignoreElements(),
  );

export const FilesEpics = combineEpics(
  uploadFileEpic,
  deleteFileEpic,
  deleteFileFailEpic,
  deleteIconEpic,
  replaceIconEpic,
);
