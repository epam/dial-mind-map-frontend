import { useCallback } from 'react';

import { GraphActions } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

export const RelayoutConfirmModal = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsRelayoutConfirmModalOpen);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsRelayoutConfirmModalOpen(false));
  }, [dispatch]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Adjust layout"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">All nodes will be repositioned to improve graph readability.</p>
        </div>
        <div className="flex w-full items-center justify-end gap-3">
          <button
            className="button button-secondary text-sm"
            onClick={() => {
              handleClose();
            }}
          >
            Cancel
          </button>
          <button
            className="button button-primary text-sm"
            onClick={() => {
              handleClose();
              dispatch(GraphActions.relayout());
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
};
