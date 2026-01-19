import { useCallback } from 'react';

import Modal from '@/components/common/Modal';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { ModalState } from '@/types/modal';

export const SourceToGraphConfirmModal = ({
  handleSourceSelection,
}: {
  handleSourceSelection: (sourceId: string) => void;
}) => {
  const dispatch = useBuilderDispatch();
  const sourceIdToApplyToGraph = useBuilderSelector(UISelectors.selectSourceIdToApplyToGraph);
  const applicationName = useBuilderSelector(ApplicationSelectors.selectApplicationName);

  const handleClose = useCallback(() => {
    dispatch(UIActions.setSourceIdToApplyToGraph());
  }, [dispatch]);

  return (
    <Modal
      portalId="theme-main"
      containerClassName="inline-block w-full max-w-[400px] px-3 py-4 md:p-6"
      state={sourceIdToApplyToGraph ? ModalState.OPENED : ModalState.CLOSED}
      onClose={handleClose}
      heading="Confirm graph update"
      headingClassName="text-primary"
      dismissProps={{ outsidePress: true }}
      hideClose
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-secondary">
            Applying the source changes will trigger a graph update. All your previous changes will be saved. Are you
            sure you want to proceed with this update?
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-3">
          <button
            className="button button-secondary flex h-[38px] items-center text-sm"
            onClick={() => {
              handleSourceSelection(sourceIdToApplyToGraph!);
              handleClose();
            }}
          >
            Select more
          </button>
          <button
            className="button button-secondary flex h-[38px] items-center text-sm"
            onClick={() => {
              handleClose();
            }}
          >
            Cancel
          </button>
          <button
            className="button button-primary flex h-[38px] items-center text-sm"
            onClick={() => {
              handleClose();
              dispatch(
                BuilderActions.generateMindmap({ applySources: [sourceIdToApplyToGraph!], name: applicationName }),
              );
            }}
          >
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};
