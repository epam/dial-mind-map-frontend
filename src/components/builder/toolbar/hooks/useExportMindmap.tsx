import { useDispatch } from 'react-redux';

import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

export const useExportMindmap = () => {
  const dispatch = useDispatch();
  const isExportMindmapInProgress = useBuilderSelector(BuilderSelectors.selectIsMindmapExportInProgress);

  const onExportMindmapClick = () => {
    dispatch(BuilderActions.exportMindmap());
  };

  return {
    isExportMindmapInProgress,
    onExportMindmapClick,
  };
};
