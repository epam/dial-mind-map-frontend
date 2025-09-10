import { ElementType } from 'react';

import { NodeShapes } from '@/types/customization';

import { BarrelShapeIcon } from './icons/BarrelShapeIcon';
import { BottomRoundRectangleShapeIcon } from './icons/BottomRoundRectangleShapeIcon';
import { ConcaveHexagonShapeIcon } from './icons/ConcaveHexagonShapeIcon';
import { CutRectangleShapeIcon } from './icons/CutRectangleShapeIcon';
import { DiamondShapeIcon } from './icons/DiamondShapeIcon';
import { EllipseShapeIcon } from './icons/EllipseShapeIcon';
import { HeptagonShapeIcon } from './icons/HeptagonShapeIcon';
import { HexagonShapeIcon } from './icons/HexagonShapeIcon';
import { OctagonShapeIcon } from './icons/OctagonShapeIcon';
import { PentagonShapeIcon } from './icons/PentagonShapeIcon';
import { RectangleShapeIcon } from './icons/RectangleShapeIcon';
import { RhomboidShapeIcon } from './icons/RhomboidShapeIcon';
import { RoundRectangleShapeIcon } from './icons/RoundRectangleShapeIcon';
import { StarShapeIcon } from './icons/StarShapeIcon';
import { TagShapeIcon } from './icons/TagShapeIcon';

interface ShapeSettings {
  id: string;
  value: NodeShapes;
  label: string;
  icon: ElementType;
}

export const ShapesSettings: ShapeSettings[] = [
  {
    id: 'round-rectangle',
    value: 'round-rectangle',
    label: 'Round-rectangle',
    icon: RoundRectangleShapeIcon,
  },
  {
    id: 'rectangle',
    value: 'rectangle',
    label: 'Rectangle',
    icon: RectangleShapeIcon,
  },
  {
    id: 'cut-rectangle',
    value: 'cut-rectangle',
    label: 'Cut-rectangle',
    icon: CutRectangleShapeIcon,
  },
  {
    id: 'barrel',
    value: 'barrel',
    label: 'Barrel',
    icon: BarrelShapeIcon,
  },
  {
    id: 'ellipse',
    value: 'ellipse',
    label: 'Ellipse',
    icon: EllipseShapeIcon,
  },
  {
    id: 'diamond',
    value: 'diamond',
    label: 'Diamond',
    icon: DiamondShapeIcon,
  },
  // {
  //   id: 'round-diamond',
  //   value: 'round-diamond',
  //   label: 'Round-diamond',
  //   icon: RoundDiamondShapeIcon,
  // },
  {
    id: 'bottom-round-rectangle',
    value: 'bottom-round-rectangle',
    label: 'Bottom-round-rectangle',
    icon: BottomRoundRectangleShapeIcon,
  },
  {
    id: 'rhomboid',
    value: 'rhomboid',
    label: 'Rhomboid',
    icon: RhomboidShapeIcon,
  },
  {
    id: 'pentagon',
    value: 'pentagon',
    label: 'Pentagon',
    icon: PentagonShapeIcon,
  },
  // {
  //   id: 'round-pentagon',
  //   value: 'round-pentagon',
  //   label: 'Round-pentagon',
  //   icon: RoundPentagonShapeIcon,
  // },
  {
    id: 'hexagon',
    value: 'hexagon',
    label: 'Hexagon',
    icon: HexagonShapeIcon,
  },
  // {
  //   id: 'round-hexagon',
  //   value: 'round-hexagon',
  //   label: 'Round-hexagon',
  //   icon: RoundHexagonShapeIcon,
  // },
  {
    id: 'concave-hexagon',
    value: 'concave-hexagon',
    label: 'Concave-hexagon',
    icon: ConcaveHexagonShapeIcon,
  },
  {
    id: 'heptagon',
    value: 'heptagon',
    label: 'Heptagon',
    icon: HeptagonShapeIcon,
  },
  // {
  //   id: 'round-heptagon',
  //   value: 'round-heptagon',
  //   label: 'Round-heptagon',
  //   icon: RoundHeptagonShapeIcon,
  // },
  {
    id: 'octagon',
    value: 'octagon',
    label: 'Octagon',
    icon: OctagonShapeIcon,
  },
  // {
  //   id: 'round-octagon',
  //   value: 'round-octagon',
  //   label: 'Round-octagon',
  //   icon: RoundOctagonShapeIcon,
  // },
  {
    id: 'star',
    value: 'star',
    label: 'Star',
    icon: StarShapeIcon,
  },
  {
    id: 'tag',
    value: 'tag',
    label: 'Tag',
    icon: TagShapeIcon,
  },
  // {
  //   id: 'round-tag',
  //   value: 'round-tag',
  //   label: 'Round-tag',
  //   icon: RoundTagShapeIcon,
  // },
];
