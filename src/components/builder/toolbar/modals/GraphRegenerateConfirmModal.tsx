import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

interface GraphRegenerateConfirmModalProps {
  isOpen: boolean;
  handleClose: () => void;
  handleRegenerate: () => void;
}

export const GraphRegenerateConfirmModal: React.FC<GraphRegenerateConfirmModalProps> = ({
  isOpen,
  handleClose,
  handleRegenerate,
}) => {
  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Regenerate Graph"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">
            Are you sure you want to regenerate the graph from scratch? All previous changes will be lost.
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-3">
          <button className="button button-secondary text-sm" onClick={handleClose}>
            Cancel
          </button>
          <button className="button button-primary text-sm" onClick={handleRegenerate}>
            Regenerate
          </button>
        </div>
      </div>
    </Modal>
  );
};
