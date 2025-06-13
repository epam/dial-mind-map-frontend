/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { HistoryActionTypes } from '@/types/common';

import { BuilderRootState } from '..';

export interface HistoryState {
  isUndo: boolean;
  isRedo: boolean;
}

export const HistoryInitialState: HistoryState = {
  isUndo: false,
  isRedo: false,
};

export const historySlice = createSlice({
  name: 'history',
  initialState: HistoryInitialState,
  reducers: {
    fetchUndoRedo: state => state,
    applyAction: (state, payload: PayloadAction<HistoryActionTypes>) => state,
    setIsRedo: (state, { payload }: PayloadAction<boolean>) => {
      state.isRedo = payload;
    },
    setIsUndo: (state, { payload }: PayloadAction<boolean>) => {
      state.isUndo = payload;
    },
  },
});

const rootSelector = (state: BuilderRootState): HistoryState => state.history;

const selectIsRedo = createSelector([rootSelector], state => state.isRedo);

const selectIsUndo = createSelector([rootSelector], state => state.isUndo);

export const HistoryActions = historySlice.actions;

export const HistorySelectors = {
  selectIsRedo,
  selectIsUndo,
};
