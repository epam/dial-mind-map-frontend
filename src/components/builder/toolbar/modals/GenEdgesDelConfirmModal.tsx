import { useCallback } from 'react';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

export const GenEdgesDelConfirmModal = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelConfirmModalOpen);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsGenEdgesDelConfirmModalOpen(false));
  }, [dispatch]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Confirm deletion"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">Are you sure you want to delete all complemented edges?</p>
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
              dispatch(BuilderActions.deleteGeneratedEdges());
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};
