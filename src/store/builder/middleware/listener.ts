import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { StorageKeys } from '@/types/storage';
import { BrowserStorage } from '@/utils/app/browser-storage';

import { BuilderRootState } from '..';
import { PreferencesActions, PreferencesState } from '../preferences/preferences.reducers';
import { UIActions, UIState, UIStoredState } from '../ui/ui.reducers';

export const ListenerMiddleware = createListenerMiddleware();

ListenerMiddleware.startListening({
  matcher: isAnyOf(PreferencesActions.setIsGenEdgesConfirmModalSkipped),
  effect: (_, listenerApi) => {
    const state = (listenerApi.getState() as BuilderRootState).preferences as PreferencesState;
    BrowserStorage.setData<PreferencesState>(StorageKeys.Preferences, state);
  },
});

ListenerMiddleware.startListening({
  matcher: isAnyOf(UIActions.setAreGeneretedEdgesShowen, UIActions.setCurrentView),
  effect: (_, listenerApi) => {
    const state = (listenerApi.getState() as BuilderRootState).ui as UIState;
    BrowserStorage.setData<UIStoredState>(StorageKeys.UI, {
      areGeneretedEdgesShowen: state.areGeneretedEdgesShowen,
      currentView: state.currentView,
    } as UIStoredState);
  },
});
