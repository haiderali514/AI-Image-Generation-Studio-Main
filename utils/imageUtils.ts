
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates a small base64 thumbnail from ImageData.
 * @param imageData The ImageData of the layer content.
 * @param width The desired thumbnail width.
 * @param height The desired thumbnail height.
 * @returns A base64 encoded string of the thumbnail image.
 */
export const generateThumbnail = (imageData: ImageData | null, width: number, height: number): string => {
  if (!imageData) {
    // Return a transparent placeholder if there's no image data
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  sourceCanvas.getContext('2d')?.putImageData(imageData, 0, 0);

  // Calculate aspect ratio to fit the thumbnail dimensions
  const hRatio = width / imageData.width;
  const vRatio = height / imageData.height;
  const ratio = Math.min(hRatio, vRatio);

  const centerShift_x = (width - imageData.width * ratio) / 2;
  const centerShift_y = (height - imageData.height * ratio) / 2;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(
    sourceCanvas,
    0, 0, imageData.width, imageData.height,
    centerShift_x, centerShift_y, imageData.width * ratio, imageData.height * ratio
  );

  return canvas.toDataURL('image/png');
};