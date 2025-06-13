import { IconCheck } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { PreferencesActions, PreferencesSelectors } from '@/store/builder/preferences/preferences.reducers';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

import Modal from '../../common/Modal';

export const GenEdgesConfirmModal = () => {
  const dispatch = useBuilderDispatch();
  const isOpen = useBuilderSelector(UISelectors.selectIsGenEdgesConfirmModalOpen);
  const isGenEdgesConfirmModalSkipped = useBuilderSelector(PreferencesSelectors.selectIsGenEdgesConfirmModalSkipped);
  const [isChecked, setIsChecked] = useState(isGenEdgesConfirmModalSkipped);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setIsGenEdgesConfirmModalOpen(false));
  }, [dispatch]);

  return (
    <Modal
      portalId="toolbar"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={isOpen ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Complement edges"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">Complement edges to complete the graph.</p>
        </div>
        <div className="relative flex items-center">
          <input
            name="skipNextTime"
            checked={isChecked}
            onChange={val => {
              setIsChecked(val.target.checked);
            }}
            type="checkbox"
            className="checkbox peer size-[18px]"
          />
          <IconCheck
            size={18}
            className="pointer-events-none invisible absolute text-accent-primary peer-checked:visible"
          />
          <label className="text-sm text-secondary" htmlFor="skipNextTime">
            Don&apos;t show confirmation next time
          </label>
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
              dispatch(BuilderActions.generateEdges());
              dispatch(PreferencesActions.setIsGenEdgesConfirmModalSkipped(isChecked));
            }}
          >
            Complement
          </button>
        </div>
      </div>
    </Modal>
  );
};
