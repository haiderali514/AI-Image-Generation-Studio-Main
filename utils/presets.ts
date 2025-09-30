/**
 * @file This file centralizes all document preset definitions and their associated TypeScript types,
 * including logic for managing user-saved custom presets in localStorage.
 */

const PRESETS_STORAGE_KEY = 'photoshop-ai-presets';

/**
 * Defines the structure for a saved custom preset.
 */
export interface CustomPreset {
  name: string;
  w: number;
  h: number;
  res: number;
  units: string;
  bg: string;
  bgColor?: string;
}

/**
 * Defines a unified Preset type to ensure all preset arrays have consistent optional properties.
 */
export type Preset = Partial<CustomPreset> & { name: string; w: number; h: number; res?: number };


// --- LocalStorage Preset Management ---

/**
 * Retrieves all custom presets from localStorage.
 * @returns {CustomPreset[]} An array of custom presets.
 */
export const getCustomPresets = (): CustomPreset[] => {
  try {
    const savedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    return savedPresets ? JSON.parse(savedPresets) : [];
  } catch (error) {
    console.error("Failed to parse custom presets from localStorage:", error);
    return [];
  }
};

/**
 * Saves a new custom preset to localStorage.
 * @param {CustomPreset} newPreset - The preset object to save.
 * @returns {{ success: boolean, message: string, presets: CustomPreset[] }} Operation result.
 */
export const saveCustomPreset = (newPreset: CustomPreset): { success: boolean, message: string, presets: CustomPreset[] } => {
  if (!newPreset.name.trim()) {
    return { success: false, message: 'Preset name cannot be empty.', presets: getCustomPresets() };
  }
  const currentPresets = getCustomPresets();
  if (currentPresets.some(p => p.name.toLowerCase() === newPreset.name.toLowerCase())) {
    return { success: false, message: 'A preset with this name already exists.', presets: currentPresets };
  }
  const updatedPresets = [...currentPresets, newPreset];
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  return { success: true, message: `Preset "${newPreset.name}" saved!`, presets: updatedPresets };
};

/**
 * Deletes a custom preset from localStorage.
 * @param {string} presetName - The name of the preset to delete.
 * @returns {CustomPreset[]} The updated list of presets.
 */
export const deleteCustomPreset = (presetName: string): CustomPreset[] => {
  const currentPresets = getCustomPresets();
  const updatedPresets = currentPresets.filter(p => p.name !== presetName);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  return updatedPresets;
};

/**
 * Renames a custom preset in localStorage.
 * @param {string} oldName - The current name of the preset.
 * @param {string} newName - The new name for the preset.
 * @returns {{ success: boolean, message: string, presets: CustomPreset[] }} Operation result.
 */
export const renameCustomPreset = (oldName: string, newName: string): { success: boolean, message: string, presets: CustomPreset[] } => {
  if (!newName.trim()) {
    return { success: false, message: 'Preset name cannot be empty.', presets: getCustomPresets() };
  }
  const currentPresets = getCustomPresets();
  if (newName.toLowerCase() !== oldName.toLowerCase() && currentPresets.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
    return { success: false, message: 'A preset with this name already exists.', presets: currentPresets };
  }
  const updatedPresets = currentPresets.map(p =>
    p.name === oldName ? { ...p, name: newName } : p
  );
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  return { success: true, message: 'Preset renamed successfully.', presets: updatedPresets };
};


// --- Static Preset Definitions ---

export const defaultPreset: Preset = {
  name: 'Default Photoshop Size',
  w: 1510,
  h: 1080,
  res: 72,
  units: 'Pixels',
  bg: 'White',
};

export const mostUsedPresets: Preset[] = [
    defaultPreset,
    { name: 'Instagram Post', w: 1080, h: 1080, res: 72 },
    { name: 'Instagram Story', w: 1080, h: 1920, res: 72 },
    { name: 'HDTV 1080p', w: 1920, h: 1080, res: 72 },
    { name: 'UHDTV 4K', w: 3840, h: 2160, res: 72 },
    { name: 'Landscape 4x6', w: 1800, h: 1200, res: 300 },
];

export const photoPresets: Preset[] = [
    { name: 'Landscape 4x6', w: 1800, h: 1200, res: 300 },
    { name: 'Landscape 5x7', w: 2100, h: 1500, res: 300 },
    { name: 'Landscape 8x10', w: 3000, h: 2400, res: 300 },
    { name: 'Portrait 4x6', w: 1200, h: 1800, res: 300 },
    { name: 'Portrait 5x7', w: 1500, h: 2100, res: 300 },
    { name: 'Portrait 8x10', w: 2400, h: 3000, res: 300 },
];

export const socialMediaPresets: Preset[] = [
    { name: 'Instagram Post', w: 1080, h: 1080, res: 72 },
    { name: 'Instagram Story', w: 1080, h: 1920, res: 72 },
    { name: 'Facebook Post', w: 1200, h: 630, res: 72 },
    { name: 'X (Twitter) Post', w: 1600, h: 900, res: 72 },
    { name: 'Pinterest Pin', w: 1000, h: 1500, res: 72 },
    { name: 'LinkedIn Post', w: 1200, h: 627, res: 72 },
];

export const filmAndVideoPresets: Preset[] = [
    { name: 'HDTV 1080p', w: 1920, h: 1080, res: 72 },
    { name: 'UHDTV 4K', w: 3840, h: 2160, res: 72 },
    { name: 'HDV 720p', w: 1280, h: 720, res: 72 },
    { name: 'DCI 2K Cinema', w: 2048, h: 1080, res: 72 },
    { name: 'DCI 4K Cinema', w: 4096, h: 2160, res: 72 },
    { name: 'UHDTV 8K', w: 7680, h: 4320, res: 72 },
];