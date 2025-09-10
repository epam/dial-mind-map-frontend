import { useDispatch } from 'react-redux';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';

export const useExportAppearance = () => {
  const dispatch = useDispatch();
  const isExportInProgress = useBuilderSelector(AppearanceSelectors.selectIsExportInProgress);

  const onExportClick = () => {
    dispatch(AppearanceActions.exportAppearances());
  };

  return {
    isExportInProgress,
    onExportClick,
  };
};
