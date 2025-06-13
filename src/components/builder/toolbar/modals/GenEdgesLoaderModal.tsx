import { useCallback } from 'react';

import Loader from '@/components/builder/common/Loader';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

export const GenEdgesLoaderModal = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsGenEdgesLoaderModalOpen);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsGenEdgesLoaderModalOpen(false));
  }, [dispatch]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[260px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <Loader size={60} />
        <div className="self-center text-xl">Generating edges</div>
      </div>
    </Modal>
  );
};

GenEdgesLoaderModal.displayName = 'GenEdgesLoaderModal';
