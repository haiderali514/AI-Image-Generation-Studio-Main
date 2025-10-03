
import { DocumentSettings, ProjectFile, SerializedLayer, Layer } from '../types';
import { imageDataToBase64, base64ToImageData, generateThumbnail } from './imageUtils';

export const saveProject = async (documentSettings: DocumentSettings, layers: Layer[]): Promise<void> => {
  const serializedLayers: SerializedLayer[] = layers.map(layer => ({
    ...layer,
    imageData: layer.imageData ? imageDataToBase64(layer.imageData) : null,
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

        const layers: Layer[] = await Promise.all(
          projectFile.layers.map(async (sl): Promise<Layer> => {
            const imageData = sl.imageData
              ? await base64ToImageData(sl.imageData, projectFile.documentSettings.width, projectFile.documentSettings.height)
              : null;
            return {
              ...sl,
              x: sl.x ?? 0,
              y: sl.y ?? 0,
              imageData,
              thumbnail: generateThumbnail(imageData, 48, 40),
            };
          })
        );
        
        resolve({ documentSettings: projectFile.documentSettings, layers });
      } catch (error) {
        reject(new Error('Failed to parse project file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};