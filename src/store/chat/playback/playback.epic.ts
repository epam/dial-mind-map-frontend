import { combineEpics } from 'redux-observable';

import { changeFocusNodeEpic } from './epics/changeFocusNode.epic';
import { initEpic } from './epics/init.epic';
import { playbackNextStepEpic } from './epics/playbackNextStep.epic';
import { playbackPreviousStepEpic } from './epics/playbackPreviousStep.epic';
import { revertConversationEpic } from './epics/revertConversation.epic';
import { robotMessagePostStreamEpic } from './epics/robotMessagePostStream.epic';
import { streamBotMessageEpic } from './epics/streamBotMessage.epic';
import { updateConversationEpic } from './epics/updateConversation.epic';

export const PlaybackEpics = combineEpics(
  playbackNextStepEpic,
  playbackPreviousStepEpic,
  changeFocusNodeEpic,
  initEpic,
  updateConversationEpic,
  revertConversationEpic,
  streamBotMessageEpic,
  robotMessagePostStreamEpic,
);
