import { combineEpics } from 'redux-observable';

import { changeSourceNameEpic } from './epics/changeSourceName.epic';
import { createSourceEpic } from './epics/createSource.epic';
import { createSourceVersionEpic } from './epics/createSourceVersion.epic';
import { deleteSourceEpic } from './epics/deleteSource.epic';
import { downloadSourceEpic } from './epics/downloadSource.epic';
import { fetchSourcesEpic } from './epics/fetchSources.epic';
import { initSourcesEpic } from './epics/initSources.epic';
import { recreateSourceVersionEpic } from './epics/recreateSourceVersion.epic';
import { reindexSourcesEpic } from './epics/reindexSources.epic';
import { setActiveSourceVersionEpic } from './epics/setActiveSourceVersion.epic';
import { sourceStatusSubscribeEpic } from './epics/sourceStatusSubscribe.epic';
import { updateSourceEpic } from './epics/updateSource.epic';

export const SourcesEpics = combineEpics(
  initSourcesEpic,
  fetchSourcesEpic,
  setActiveSourceVersionEpic,
  deleteSourceEpic,
  changeSourceNameEpic,
  downloadSourceEpic,
  createSourceEpic,
  sourceStatusSubscribeEpic,
  createSourceVersionEpic,
  recreateSourceVersionEpic,
  updateSourceEpic,
  reindexSourcesEpic,
);
