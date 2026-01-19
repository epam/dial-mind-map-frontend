import React, { useCallback } from 'react';

import { AppearanceActions } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../../common/Modal';

export const ResetThemeConfirmModal: React.FC = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsResetThemeConfirmModalOpen);
  const theme = useBuilderSelector(UISelectors.selectTheme) || 'dark';

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsResetThemeConfirmModalOpen(false));
  }, [dispatch]);

  const handleReset = useCallback(() => {
    handleClose();
    dispatch(AppearanceActions.resetThemeConfig({ theme: theme }));
  }, [dispatch, handleClose, theme]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Reset Theme"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">Are you sure you want to reset the theme to its default settings?</p>
        </div>
        <div className="flex w-full items-center justify-end gap-3">
          <button className="button button-secondary text-sm" onClick={handleClose}>
            Cancel
          </button>
          <button className="button button-primary text-sm" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </Modal>
  );
};
