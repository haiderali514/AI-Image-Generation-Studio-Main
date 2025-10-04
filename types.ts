

export enum Tool {
  HOME = 'HOME',
  FILES = 'FILES',
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  DRAW_TO_IMAGE = 'DRAW_TO_IMAGE',
  GENERATIVE_FILL = 'GENERATIVE_FILL',
  REMOVE_BACKGROUND = 'REMOVE_BACKGROUND',
}

/**
 * Defines the set of tools available within the main editor, redesigned for a modern workflow.
 */
export enum EditorTool {
  TRANSFORM = 'TRANSFORM',
  GENERATIVE = 'GENERATIVE',
  ADJUST = 'ADJUST',
  SELECT = 'SELECT',
  RETOUCH = 'RETOUCH',
  QUICK_ACTIONS = 'QUICK_ACTIONS',
  EFFECTS = 'EFFECTS',
  PAINT = 'PAINT',
  SHAPES = 'SHAPES',
  TYPE = 'TYPE',
  ADD_IMAGE = 'ADD_IMAGE',
}

export type TransformSubTool = 'move' | 'transform' | 'crop';
export type GenerativeSubTool = 'fill' | 'expand' | 'textToImage';
export type AdjustSubTool = 'brightnessContrast' | 'levels' | 'curves' | 'exposure';
export type SelectSubTool = 'rectangle' | 'ellipse' | 'lasso' | 'subject';
export type RetouchSubTool = 'spotHeal' | 'cloneStamp' | 'patch';
export type QuickActionsSubTool = 'removeBackground' | 'enhance';
export type EffectsSubTool = 'blur' | 'sharpen' | 'noise';
export type ShapesSubTool = 'rectangle' | 'ellipse' | 'polygon' | 'line';
export type TypeSubTool = 'horizontal' | 'vertical';


export type AutoSelectType = 'Layer' | 'Group';

/**
 * Defines the properties for a new document created by the user.
 */
export interface DocumentSettings {
  name: string;
  width: number;
  height: number;
  units: string;
  resolution: number;
  resolutionUnit: string;
  background: string;
  customBgColor: string;
}


/**
 * Represents a saved project with metadata for the recent files list.
 */
export interface RecentProject extends DocumentSettings {
  id: string;
  lastModified: number;
  thumbnail?: string;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';


/**
 * Represents a single layer in the editor.
 */
export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  isBackground?: boolean; 
  opacity: number; // 0-1
  blendMode: BlendMode;
  thumbnail?: string;
  imageData: ImageData | null;
  x: number;
  y: number;
}

/**
 * Defines the possible text alignment options for the Text tool.
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Defines the possible shapes for the brush tip.
 */
export type BrushShape = 'round' | 'square';

export type PaintSubTool = 'brush' | 'eraser';

// --- Project Save/Load Types ---

/**
 * A version of the Layer type where image data is serialized to a base64 string.
 */
export interface SerializedLayer extends Omit<Layer, 'imageData' | 'thumbnail'> {
  imageData: string | null; // base64 string
}

/**
 * The structure of the saved project file.
 */
export interface ProjectFile {
  documentSettings: DocumentSettings;
  layers: SerializedLayer[];
}