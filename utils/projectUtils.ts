import { DocumentSettings, ProjectFile, SerializedLayer, Layer } from '../types';
import { imageDataToBase64, base64ToImageData, generateThumbnail } from './imageUtils';

export const saveProject = async (documentSettings: DocumentSettings, layers: Layer[]): Promise<void> => {
  const serializedLayers: SerializedLayer[] = await Promise.all(layers.map(async (layer) => {
    // FIX: Destructure layer to correctly handle imageData type conversion, preventing a TypeScript error.
    const { imageData, thumbnail, ...rest } = layer;
    const serializedLayer: SerializedLayer = {
      ...rest,
      imageData: imageData ? imageDataToBase64(imageData) : null,
    };
    return serializedLayer;
  }));

  const projectFile: ProjectFile = {
    documentSettings,
    layers: serializedLayers,
  };

  const jsonString = JSON.stringify(projectFile, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${documentSettings.name}.aips`; // AI Photoshop
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const loadProject = async (file: File): Promise<{ documentSettings: DocumentSettings, layers: Layer[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
            return reject(new Error('File content is empty.'));
        }
        const jsonString = event.target.result as string;
        const projectFile: ProjectFile = JSON.parse(jsonString);
        const { documentSettings } = projectFile;

        const layers: Layer[] = await Promise.all(
          projectFile.layers.map(async (sl): Promise<Layer> => {
            const imageData = sl.imageData
              ? await base64ToImageData(sl.imageData, sl.width ?? documentSettings.width, sl.height ?? documentSettings.height)
              : null;
            
            // Backward compatibility check for old project format
            const isOldFormat = sl.width === undefined || sl.height === undefined;
            
            const width = imageData?.width ?? documentSettings.width;
            const height = imageData?.height ?? documentSettings.height;

            return {
              ...sl,
              // If old format, convert top-left x/y to center x/y
              x: isOldFormat ? (sl.x ?? 0) + width / 2 : sl.x,
              y: isOldFormat ? (sl.y ?? 0) + height / 2 : sl.y,
              // Provide default transform properties if missing
              width: width,
              height: height,
              rotation: sl.rotation ?? 0,
              scaleX: sl.scaleX ?? 1,
              scaleY: sl.scaleY ?? 1,
              imageData,
              thumbnail: generateThumbnail(imageData, 48, 40),
            };
          })
        );
        
        resolve({ documentSettings, layers });
      } catch (error) {
        console.error("Project loading error:", error);
        reject(new Error('Failed to parse project file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};