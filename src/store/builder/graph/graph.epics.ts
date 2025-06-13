import { UnknownAction } from '@reduxjs/toolkit';
import isEqual from 'lodash-es/isEqual';
import merge from 'lodash-es/merge';
import { combineEpics } from 'redux-observable';
import { EMPTY, of } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { BuilderRootEpic } from '@/types/store';
import { ToastType } from '@/types/toasts';
import { isNode } from '@/utils/app/graph/typeGuards';

import { UIActions } from '../ui/ui.reducers';
import { GraphActions, GraphSelectors } from './graph.reducers';

const addOrUpdateElementsEpic: BuilderRootEpic = (action$, state$) =>
  action$.pipe(
    filter(GraphActions.addOrUpdateElements.match),
    concatMap(({ payload }) => {
      const currentElements = GraphSelectors.selectElements(state$.value);
      const focusNodeId = GraphSelectors.selectFocusNodeId(state$.value);
      let modified = false;
      let existNodeId: string | null = null;
      let shouldShowToast = false;
      const updatedElements = [...currentElements];

      for (const newElement of payload) {
        const index = updatedElements.findIndex(el => el.data.id === newElement.data.id);
        if (index !== -1) {
          const mergedData = merge({}, updatedElements[index].data, newElement.data);

          if (!isEqual(updatedElements[index].data, mergedData)) {
            updatedElements[index] = { ...updatedElements[index], data: mergedData };
            modified = true;
          } else {
            const isNodeElement = isNode(newElement.data);
            if (isNodeElement) {
              existNodeId = newElement.data.id;
            }
            modified = true;
            if (isNodeElement && newElement.data.id !== focusNodeId) {
              shouldShowToast = true;
            }
          }
        } else {
          updatedElements.push(newElement);
          modified = true;
        }
      }

      if (modified) {
        const actionsToDispatch: UnknownAction[] = [
          GraphActions.setElements({
            elements: updatedElements.filter(
              element =>
                !(element.data.id === focusNodeId && isNode(element.data) && element.data.label === NEW_QUESTION_LABEL),
            ),
            skipLayout: false,
          }),
        ];
        if (existNodeId) {
          actionsToDispatch.push(GraphActions.setFocusNodeId(existNodeId));
        }
        if (shouldShowToast) {
          actionsToDispatch.push(
            UIActions.showToast({
              message: 'A node with that question already exists',
              type: ToastType.Info,
              duration: 1500,
            }),
          );
        }
        return of(...actionsToDispatch);
      }

      return EMPTY;
    }),
  );

export const GraphEpics = combineEpics(addOrUpdateElementsEpic);
