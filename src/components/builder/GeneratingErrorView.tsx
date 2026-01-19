import { IconAlertTriangle } from '@tabler/icons-react';
import { useLocalStorageState } from 'ahooks';

import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { GenerationStatus } from '@/types/sources';

import Button from '../common/Button/Button';

interface GeneratingErrorViewProps {
  title: string;
  message?: string;
}

export const GeneratingErrorView: React.FC<GeneratingErrorViewProps> = ({ title, message }) => {
  const dispatch = useBuilderDispatch();
  const isGenerated = useBuilderSelector(BuilderSelectors.selectIsGenerated);
  const applicationReference = useBuilderSelector(ApplicationSelectors.selectApplication)?.reference;
  const [generationErrorSeen, setGenerationErrorSeen] = useLocalStorageState(`generation-error-seen`, {
    defaultValue: {},
  });

  const setSeenError = () => {
    if (applicationReference) {
      setGenerationErrorSeen({
        ...generationErrorSeen,
        [applicationReference]: true,
      });
    }
    if (isGenerated) {
      dispatch(BuilderActions.fetchGraph());
    }
  };

  return (
    <div className="m-1 flex size-full flex-col items-center justify-center gap-7 text-center">
      <IconAlertTriangle size={80} stroke={0.5} className="text-secondary" />
      <div className="flex flex-col gap-7">
        <div className="flex w-[360px] flex-col gap-4">
          <div className="text-[20px]">{title}</div>
          <div className="text-sm">
            {message ? (
              message
            ) : (
              <>
                An error occurred during graph generation. <br /> Please review your documents and try again.
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          htmlType="button"
          onClick={() => {
            dispatch(
              BuilderActions.setGenerationStatus(
                isGenerated ? GenerationStatus.FINISHED : GenerationStatus.NOT_STARTED,
              ),
            );
            dispatch(BuilderActions.setGeneratingStatus({ title: 'Graph generation' }));
            setSeenError();
          }}
          variant="primary"
          label="Return to sources"
        />
      </div>
    </div>
  );
};
