
export enum Tool {
  HOME = 'HOME',
  FILES = 'FILES',
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  DRAW_TO_IMAGE = 'DRAW_TO_IMAGE',
  GENERATIVE_FILL = 'GENERATIVE_FILL',
  REMOVE_BACKGROUND = 'REMOVE_BACKGROUND',
}

/**
 * Defines the set of tools available within the main editor.
 */
export enum EditorTool {
  MOVE = 'MOVE',
  SELECTION = 'SELECTION',
  BRUSH = 'BRUSH',
  ERASER = 'ERASER',
  FILL = 'FILL',
  TEXT = 'TEXT',
  SHAPES = 'SHAPES',
}

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

/**
 * Represents a single layer in the editor.
 */
export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number; // 0-1
  blendMode: 'normal'; // More can be added later
  // History for this layer
  history: (ImageData | null)[]; // Use null for initial empty state
  historyIndex: number;
}

/**
 * Defines the possible text alignment options for the Text tool.
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Defines the possible shapes for the brush tip.
 */
export type BrushShape = 'round' | 'square';
