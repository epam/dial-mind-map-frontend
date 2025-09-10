import { useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';

import { FormView } from './views/Form/FormView';
import { JsonView } from './views/Json/JsonView';

export const AppearanceEditor = () => {
  const selectedCustomizeView = useBuilderSelector(UISelectors.selectCurrentCustomizeView);

  const renderView = () => {
    switch (selectedCustomizeView) {
      case 'form':
        return <FormView />;
      case 'json':
        return <JsonView />;
      default:
        return null;
    }
  };

  return renderView();
};
