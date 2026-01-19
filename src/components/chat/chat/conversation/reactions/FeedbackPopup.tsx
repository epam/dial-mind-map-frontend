import { ButtonVariant, DialButton, DialTextarea } from '@epam/ai-dial-ui-kit';
import { useCallback, useState } from 'react';

import Modal from '@/components/common/Modal';
import { FEEDBACK_MESSAGE_LIMIT } from '@/constants/app';
import { ModalState } from '@/types/modal';

export const FeedbackPopup = ({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(() => {
    onSubmit(message);
  }, [message, onSubmit]);

  const handleChange = useCallback((value: string) => {
    if (value.length <= FEEDBACK_MESSAGE_LIMIT) {
      setMessage(value);
    }
  }, []);

  return (
    <Modal
      portalId="rating-feedback"
      containerClassName="mindmap-popup w-full max-w-[500px] rounded-[10px] p-6"
      state={open ? ModalState.OPENED : ModalState.CLOSED}
      onClose={onClose}
      heading="Response feedback"
      headingClassName="mindmap-popup__header font-semibold text-primary"
      dismissProps={{ outsidePress: true }}
    >
      <div className="mindmap-popup__content flex flex-col gap-4">
        <p className="mindmap-popup__description text-secondary">
          Since the response didn’t meet your expectations, please share your feedback so we can improve.
        </p>

        <div className="mindmap-popup__field flex flex-col gap-1">
          <div className="mindmap-popup__field-label text-xs text-secondary">Response feedback</div>

          <DialTextarea
            disableTooltip
            textareaId="mindmap-dislike-feedback-text"
            placeholder="Enter response feedback"
            value={message}
            onChange={handleChange}
            className="mindmap-popup__field-input min-h-20 resize-y"
          />
        </div>

        <div className="mindmap-popup__actions flex justify-end gap-4">
          <DialButton
            variant={ButtonVariant.Secondary}
            label="Cancel"
            className="h-10 rounded-[10px]"
            onClick={onClose}
          />
          <DialButton
            variant={ButtonVariant.Primary}
            label="Confirm"
            className="h-10 rounded-[10px]"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};
