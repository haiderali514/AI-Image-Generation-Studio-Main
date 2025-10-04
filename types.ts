


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
export type PaintSubTool = 'brush' | 'eraser';
export type ShapesSubTool = 'rectangle' | 'ellipse' | 'polygon' | 'line';
export type TypeSubTool = 'horizontal' | 'vertical';

export type AnySubTool = TransformSubTool | GenerativeSubTool | AdjustSubTool | SelectSubTool | RetouchSubTool | QuickActionsSubTool | EffectsSubTool | PaintSubTool | ShapesSubTool | TypeSubTool;


export type AutoSelectType = 'Layer' | 'Group';
export type TransformMode = 'free-transform' | 'skew' | 'distort' | 'perspective';

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

interface ShapeProps {
  type: 'rectangle';
  fill: string;
  stroke: string | null;
  strokeWidth: number;
}


/**
 * Represents a single layer in the editor.
 * The transformation properties (x, y, rotation, scale) are applied
 * around the layer's center point.
 */
export interface Layer {
  id: string;
  name: string;
  type: 'pixel' | 'shape';
  isVisible: boolean;
  isLocked: boolean;
  isBackground?: boolean; 
  opacity: number; // 0-1
  blendMode: BlendMode;
  thumbnail?: string;
  imageData: ImageData | null;
  
  // Transformation properties
  x: number; // Center X coordinate relative to the document
  y: number; // Center Y coordinate relative to the document
  width: number; // The intrinsic width of the imageData or shape
  height: number; // The intrinsic height of the imageData or shape
  rotation: number; // In degrees
  scaleX: number; // Multiplier
  scaleY: number; // Multiplier

  // Shape specific properties
  shapeProps?: ShapeProps;
}

export interface TransformSession {
    layer: Layer;
    handle: string; // e.g., 'bottom-right', 'rotate'
    isAspectRatioLocked: boolean;
    originalLayer: Layer;
    startMouse: { x: number; y: number }; // Screen-relative
    startCanvasMouse: { x: number; y: number }; // Canvas-relative
    startPan: { x: number; y: number };
    startZoom: number;
    mode: TransformMode;
    previousSubTool: AnySubTool | null;
    startCursor: string;
}

export interface SnapLine {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

export interface MoveSession {
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    layerStartX: number;
    layerStartY: number;
    currentMouseX: number;
    currentMouseY: number;
}


/**
 * Defines the possible text alignment options for the Text tool.
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Defines the possible shapes for the brush tip.
 */
export type BrushShape = 'round' | 'square';

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

/**
 * Represents a single state in the editor's history.
 */
export interface HistoryState {
  layers: Layer[];
  action: string; // e.g., "Brush Stroke", "Add Layer"
}