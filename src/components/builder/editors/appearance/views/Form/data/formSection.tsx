import { Icon, IconCornerDownRight, IconProps } from '@tabler/icons-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

import { ChatNodeStyleSection } from '../components/ChatNodeStyleSection/ChatNodeStyleSection';
import { CustomStylesSection } from '../components/CustomStylesSection';
import { EdgeStyleSection } from '../components/EdgeStyleSection';
import { FontsSection } from '../components/FontsSection/FontsSection';
import { GeneralColorsSection } from '../components/GeneralColorsSection';
import { BackgroundImageSection } from '../components/GraphNodeStyleSection/BackgroundImageSection';
import { GraphFontSubSection } from '../components/GraphNodeStyleSection/GraphFontSubSection';
import { GraphNodeStyleSubSection } from '../components/GraphNodeStyleSection/GraphNodeStyleSubSection';
import { IconsSection } from '../components/IconsSection.tsx/IconsSections';
import { MainSettingsSection } from '../components/MainSettingsSection/ChatSettingsSection';
import { MindMapColorsSection } from '../components/MidmMapColorsSection';
import { ReferenceColors } from '../components/ReferenceColors';
import { SemanticColorsSection } from '../components/SemanticColorsSection';

interface FormSectionProps {
  wrapperClassName?: string;
  component?: React.ReactNode;
  title?: string;
  className?: string;
  id: string;
  Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  subSections?: FormSectionProps[];
}

export const formSections: FormSectionProps[] = [
  {
    id: 'mainSettings',
    title: 'Main settings',
    component: <MainSettingsSection />,
  },
  {
    id: 'font',
    title: 'Font',
    component: <FontsSection />,
  },
  {
    id: 'icons',
    title: 'Icons',
    component: <IconsSection />,
  },
  {
    id: 'graphNode',
    title: 'Graph node',
    wrapperClassName: 'overflow-hidden',
    subSections: [
      {
        id: 'graphNodeStyle',
        title: 'Style',
        component: <GraphNodeStyleSubSection />,
        Icon: IconCornerDownRight,
      },
      {
        id: 'backgroundImage',
        title: 'Background image',
        component: <BackgroundImageSection />,
        Icon: IconCornerDownRight,
        wrapperClassName: 'overflow-hidden',
      },
      {
        id: 'graphFont',
        title: 'Font',
        component: <GraphFontSubSection />,
        Icon: IconCornerDownRight,
      },
    ],
  },
  {
    id: 'chatNodeStyle',
    title: 'Chat node style',
    component: <ChatNodeStyleSection />,
  },
  {
    id: 'edgeStyle',
    title: 'Edge style',
    component: <EdgeStyleSection />,
  },
  {
    id: 'generalColors',
    title: 'General colors',
    component: <GeneralColorsSection />,
  },
  {
    id: 'semanticColors',
    title: 'Semantic colors',
    component: <SemanticColorsSection />,
    wrapperClassName: 'min-w-0',
  },
  {
    id: 'referencesColors',
    title: 'Reference colors',
    component: <ReferenceColors />,
  },
  {
    id: 'mindMapColors',
    title: 'Mind map colors',
    component: <MindMapColorsSection />,
    wrapperClassName: 'overflow-hidden',
  },
  {
    id: 'customStyles',
    title: 'Custom styles',
    component: <CustomStylesSection />,
  },
];
