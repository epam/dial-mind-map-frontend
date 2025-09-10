import { useCallback } from 'react';

import Loader from '@/components/common/Loader';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

export const GenEdgesDelLoaderModal = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelLoaderModalOpen);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsGenEdgesDelLoaderModalOpen(false));
  }, [dispatch]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[300px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <Loader size={60} />
        <div className="self-center text-xl">Deleting generated edges</div>
      </div>
    </Modal>
  );
};
