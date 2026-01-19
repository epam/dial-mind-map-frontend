import { IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

import { ConversationActions } from '@/store/chat/conversation/conversation.reducers';
import { useChatDispatch } from '@/store/chat/hooks';
import { LikeState } from '@/types/chat';

import { FeedbackPopup } from './FeedbackPopup';
import { ReactionButton } from './ReactionButton';

export const Reactions = ({
  responseId,
  messageIndex,
  like,
}: {
  messageIndex: number;
  responseId: string;
  like?: LikeState;
}) => {
  const dispatch = useChatDispatch();

  const handleReaction = useCallback(
    (rate: LikeState, comment?: string) => {
      dispatch(
        ConversationActions.rateMessage({
          messageIndex,
          responseId,
          rate,
          comment,
        }),
      );
    },
    [dispatch, responseId, messageIndex],
  );

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const canReact = like === undefined || like === LikeState.NoState;

  const submitLike = useCallback(() => {
    if (canReact) {
      handleReaction(LikeState.Liked);
    }
  }, [handleReaction, canReact]);

  const handleDislike = useCallback(() => {
    if (canReact) {
      setIsFeedbackOpen(true);
    }
  }, [canReact]);

  const dismissFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
    handleReaction(LikeState.Disliked);
  }, [handleReaction]);

  const submitDislikeWithFeedback = useCallback(
    (text: string) => {
      setIsFeedbackOpen(false);
      handleReaction(LikeState.Disliked, text);
    },
    [handleReaction],
  );

  const showLike = like !== LikeState.Disliked;
  const showDislike = like !== LikeState.Liked;

  return (
    <div className="reactions flex items-center gap-1">
      {showLike && (
        <ReactionButton
          ariaLabel="Like"
          onClick={submitLike}
          active={like === LikeState.Liked}
          className="reactions__button--like"
        >
          <IconThumbUp size={16} />
        </ReactionButton>
      )}

      {showDislike && (
        <ReactionButton
          ariaLabel="Dislike"
          onClick={handleDislike}
          active={like === LikeState.Disliked}
          className="reactions__button--dislike"
        >
          <IconThumbDown size={16} />
        </ReactionButton>
      )}

      <FeedbackPopup open={isFeedbackOpen} onClose={dismissFeedback} onSubmit={submitDislikeWithFeedback} />
    </div>
  );
};
