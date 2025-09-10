import { IconArrowBigLeftFilled } from '@tabler/icons-react';
import { useCallback } from 'react';

import MindmapIcon from '@/icons/mindmap.svg';
import PersonIcon from '@/icons/person.svg';
import RobotIcon from '@/icons/robot.svg';
import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { IconResourceKey, ThemeConfig } from '@/types/customization';
import { constructPath } from '@/utils/app/file';

import { IconUploader } from './IconUploader';

export const IconsSection = () => {
  const application = useBuilderSelector(ApplicationSelectors.selectApplication);
  const config = useBuilderSelector(AppearanceSelectors.selectThemeConfig);
  const dispatch = useBuilderDispatch();
  const theme = useBuilderSelector(UISelectors.selectTheme);

  const getDefaultMindmapIcon = () => {
    if (!application?.icon_url) {
      return <MindmapIcon />;
    }
    return <img src={constructPath('/api', application.icon_url)} alt="Mindmap Icon" />;
  };

  const getSelectHandler = useCallback(
    (type: IconResourceKey) => (fileName: string, file: File) => {
      dispatch(
        AppearanceActions.uploadResource({
          type,
          file,
          fileName,
        }),
      );
    },
    [dispatch],
  );

  const getDeleteHandler = useCallback(
    (type: IconResourceKey) => () => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          icons: {
            ...config.icons,
            [type]: undefined,
          },
        };

        dispatch(
          AppearanceActions.updateThemeConfig({
            theme,
            config: updatedConfig,
          }),
        );
      }
    },
    [config, theme, dispatch],
  );

  const getOnSuccessUploadHandler = useCallback(
    (type: IconResourceKey) => (fileName: string) => {
      if (config) {
        const updatedConfig: ThemeConfig = {
          ...config,
          icons: {
            ...config.icons,
            [type]: fileName,
          },
        };

        dispatch(
          AppearanceActions.updateThemeConfig({
            theme,
            config: updatedConfig,
          }),
        );
      }
    },
    [config, theme, dispatch],
  );

  const iconItems = [
    {
      label: 'Mindmap',
      defaultIcon: getDefaultMindmapIcon(),
      type: IconResourceKey.MindmapIcon,
    },
    {
      label: 'User',
      defaultIcon: <PersonIcon />,
      type: IconResourceKey.UserIcon,
    },
    {
      label: 'Robot',
      defaultIcon: <RobotIcon />,
      type: IconResourceKey.RobotIcon,
    },
    {
      label: 'Back',
      defaultIcon: <IconArrowBigLeftFilled />,
      type: IconResourceKey.ArrowBackIcon,
    },
  ];

  return (
    <div className="flex flex-wrap gap-[50px]">
      {iconItems.map(({ label, defaultIcon, type }) => (
        <IconUploader
          key={label}
          label={label}
          defaultIcon={defaultIcon}
          value={config?.icons?.[type]}
          type={type}
          onSelect={getSelectHandler(type)}
          onDelete={getDeleteHandler(type)}
          onSuccessUpload={getOnSuccessUploadHandler(type)}
        />
      ))}
    </div>
  );
};
