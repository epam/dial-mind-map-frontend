import { z } from 'zod';

export const NodeShapeSchema = z.enum([
  'ellipse',
  'rectangle',
  'round-rectangle',
  'bottom-round-rectangle',
  'cut-rectangle',
  'barrel',
  'rhomboid',
  'diamond',
  'round-diamond',
  'pentagon',
  'round-pentagon',
  'hexagon',
  'round-hexagon',
  'concave-hexagon',
  'heptagon',
  'round-heptagon',
  'octagon',
  'round-octagon',
  'star',
  'tag',
  'round-tag',
]);

export enum IconResourceKey {
  MindmapIcon = 'mindmap-icon',
  UserIcon = 'user-icon',
  RobotIcon = 'robot-icon',
  ArrowBackIcon = 'arrow-back-icon',
}

export enum GraphImgResourceKey {
  BorderImg = 'border-image',
  DefaultBgImg = 'default-bg-image',
}

export enum ChatImgResourceKey {
  ChatBgImg = 'chat-bg-image',
}

export enum GraphLayoutType {
  Fcose = 'fcose',
  EllipticRing = 'elliptic-ring',
}

export enum ChatNodeResourceKey {
  MaskImg = 'mask-image',
}

export enum EdgeLineStyle {
  Solid = 'solid',
  Dotted = 'dotted',
  Dashed = 'dashed',
}

export enum ChatNodeType {
  Outlined = 'outlined',
  Filled = 'filled',
  Imaged = 'imaged',
}

export enum GraphNodeType {
  Base = 'base',
  Root = 'root',
  Level1 = 'level1',
  Level2 = 'level2',
}

export enum GraphNodeState {
  Hovered = 'hovered',
}

export enum NodeStylesKey {
  Width = 'width',
  Height = 'height',
  FontSize = 'font-size',
  TextMarginY = 'text-margin-y',
}

const TextWrapScheme = z.enum(['none', 'wrap', 'ellipsis']);

export const CytoscapeEdgeStylesSchema = z
  .object({
    width: z.number().optional(),
    'line-style': z
      .nativeEnum(EdgeLineStyle, {
        errorMap: () => ({
          message: `line-style must be one of ${Object.values(EdgeLineStyle)
            .map(v => `'${v}'`)
            .join(', ')}`,
        }),
      })
      .optional(),
  })
  .passthrough();

const CytoscapeNodeStylesSchema = z
  .object({
    shape: NodeShapeSchema.optional(),
    'corner-radius': z.string().optional(),
    'border-width': z.union([z.string(), z.number()]).optional(),
    padding: z.string().optional(),
    [NodeStylesKey.TextMarginY]: z.number().optional(),
    [NodeStylesKey.Height]: z.number().optional(),
    [NodeStylesKey.Width]: z.number().optional(),
    [NodeStylesKey.FontSize]: z.number().optional(),
    'text-wrap': TextWrapScheme.optional(),
    'text-max-width': z.number().optional(),
  })
  .passthrough();

const CytoscapeNodeStateStylesSchema = z.record(z.nativeEnum(GraphNodeState), CytoscapeNodeStylesSchema);

const CytoscapeNodeStylesWithStatesSchema = CytoscapeNodeStylesSchema.extend({
  states: CytoscapeNodeStateStylesSchema.optional(),
});

const CytoscapeNodeTypesStylesSchema = z
  .object({
    [GraphNodeType.Base]: CytoscapeNodeStylesWithStatesSchema.optional(),
    [GraphNodeType.Root]: CytoscapeNodeStylesWithStatesSchema.optional(),
    [GraphNodeType.Level1]: CytoscapeNodeStylesWithStatesSchema.optional(),
    [GraphNodeType.Level2]: CytoscapeNodeStylesWithStatesSchema.optional(),
  })
  .optional();

const CytoscapeStyles = z
  .object({
    node: CytoscapeNodeTypesStylesSchema.optional(),
    edge: z
      .object({
        base: CytoscapeEdgeStylesSchema.optional(),
      })
      .optional(),
  })
  .strict();

const BranchColorsSchema = z
  .object({
    bgColor: z.string(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    visitedBgColor: z.string().optional(),
    edgeColor: z.string().optional(),
    visitedTextColor: z.string().optional(),
    visitedBorderColor: z.string().optional(),
  })
  .strict();

const FocusedNodeColorsSchema = z.object({
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
});

const PaletteSettingsSchema = z
  .object({
    branchesColors: z.array(BranchColorsSchema),
    focusedNodeColors: FocusedNodeColorsSchema.optional(),
  })
  .strict();

const ImagesConfigSchema = z.object({
  [GraphImgResourceKey.DefaultBgImg]: z.string().optional(),
  [GraphImgResourceKey.BorderImg]: z.string().optional(),
});

const FontSchema = z.object({
  ['font-family']: z.string().optional(),
  fontFileName: z.string().optional(),
});

const CytoscapeLayoutSettingsScheme = z
  .object({
    nodeRepulsion: z.number().optional(),
    idealEdgeLength: z.number().optional(),
    edgeElasticity: z.number().optional(),
  })
  .strict();

const GraphConfigSchema = z.object({
  cytoscapeLayoutSettings: CytoscapeLayoutSettingsScheme.optional(),
  paletteSettings: PaletteSettingsSchema,
  cytoscapeStyles: CytoscapeStyles,
  images: ImagesConfigSchema.optional(),
  font: FontSchema.optional(),
  useNodeIconAsBgImage: z.boolean().optional(),
  maxNodesLimit: z.number().optional(),
  layout: z.nativeEnum(GraphLayoutType).optional(),
});

const ChatNodeSchema = z.object({
  availableNodeType: z
    .nativeEnum(ChatNodeType, {
      errorMap: () => ({
        message: `availableNodeType must be one of ${Object.values(ChatNodeType)
          .map(v => `'${v}'`)
          .join(', ')}`,
      }),
    })
    .optional(),
  'corner-radius': z.number().optional(),
  [ChatNodeResourceKey.MaskImg]: z.string().optional(),
});

const ChatImagesConfigSchema = z.object({
  [ChatImgResourceKey.ChatBgImg]: z.string().optional(),
});

const ChatConfigSchema = z
  .object({
    placeholder: z.string().optional(),
    chatSide: z.enum(['left', 'right']).optional(),
    chatNode: ChatNodeSchema.strict().optional(),
    customStyles: z.string().optional(),
    images: ChatImagesConfigSchema.optional(),
  })
  .strict();

const ColorSchema = z.object({
  default: z.string().optional(),
  hovered: z.string().optional(),
  selected: z.string().optional(),
});

const ReferenceBadgeSchema = z.object({
  backgroundColor: ColorSchema.strict().required(),
  textColor: ColorSchema.strict().required(),
});

const ReferencesConfigSchema = z.object({
  badge: ReferenceBadgeSchema.strict().required(),
});

const IconsSchema = z.object({
  [IconResourceKey.MindmapIcon]: z.string().optional(),
  [IconResourceKey.UserIcon]: z.string().optional(),
  [IconResourceKey.RobotIcon]: z.string().optional(),
  [IconResourceKey.ArrowBackIcon]: z.string().optional(),
});

const ResponsiveThresholdsSchema = z.object({
  md: z.number().min(0).optional(),
  xl: z.number().min(0).optional(),
});

export const ThemeConfigSchema = z
  .object({
    displayName: z.string().optional(),
    icons: IconsSchema.optional(),
    font: FontSchema.optional(),
    colors: z.record(z.string()).optional(),
    graph: GraphConfigSchema,
    chat: ChatConfigSchema.optional(),
    references: ReferencesConfigSchema.strict().required(),
    responsiveThresholds: ResponsiveThresholdsSchema.optional(),
  })
  .strict();

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type CytoscapeEdgeStyles = z.infer<typeof CytoscapeEdgeStylesSchema>;
export type PaletteSettings = z.infer<typeof PaletteSettingsSchema>;
export type BranchColors = z.infer<typeof BranchColorsSchema>;
export type GraphConfig = z.infer<typeof GraphConfigSchema>;
export type ThemesConfig = Record<string, ThemeConfig>; // Keyed by theme nameId (e.g., "dark", "light")
export type NodeShapes = z.infer<typeof NodeShapeSchema>;
export type CytoscapeLayoutSettings = z.infer<typeof CytoscapeLayoutSettingsScheme>;
export type CytoscapeNodeStyles = z.infer<typeof CytoscapeNodeStylesSchema>;
export type CytoscapeNodeTypesStyles = z.infer<typeof CytoscapeNodeTypesStylesSchema>;
export type CytoscapeNodeStylesWithStates = z.infer<typeof CytoscapeNodeStylesWithStatesSchema>;
export type ResponsiveThresholds = z.infer<typeof ResponsiveThresholdsSchema>;
