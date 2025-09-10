import { combineEpics } from 'redux-observable';

import { resetEpic } from './epics/reset.epic';
import { saveThemeEpic } from './epics/saveTheme.epic';
import { showErrorToastEpic } from './epics/showErrorToast.epic';
import { showToastEpic } from './epics/showToast.epic';

export const ChatUIEpics = combineEpics(resetEpic, showToastEpic, showErrorToastEpic, saveThemeEpic);
