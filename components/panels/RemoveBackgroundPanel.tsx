import React, { useState } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import * as geminiService from '../../services/geminiService';
import { fileToBase64 } from '../../utils/imageUtils';
import Icon from '../ui/Icon';

const RemoveBackgroundPanel: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setOriginalImage(file);
    setResultImage(null);
    setError(null);
    const base64 = await fileToBase64(file);
    setOriginalImageBase64(base64);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage || !originalImageBase64) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const imageUrl = await geminiService.removeBackground(originalImageBase64, originalImage.type);
      setResultImage(imageUrl);
    } catch (err) {
      setError('Failed to remove background. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {!originalImageBase64 && (
          <div className="max-w-xl mx-auto">
             <h2 className="text-2xl font-bold text-indigo-400 mb-4">Upload Image</h2>
             <p className="text-gray-400 mb-6">Select an image to remove its background. The AI will identify the main subject and create a transparent background.</p>
            <ImageUpload onUpload={handleImageUpload} title="PNG, JPG, WEBP accepted" />
          </div>
        )}
        {originalImageBase64 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-xl font-semibold">Original Image</h3>
              <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center p-2">
                <img src={originalImageBase64} alt="Original" className="max-w-full max-h-full object-contain rounded-md" />
              </div>
               <Button onClick={handleRemoveBackground} isLoading={isLoading}>
                 Remove Background
               </Button>
               <Button onClick={() => setOriginalImageBase64(null)} variant="secondary" disabled={isLoading}>
                 Upload Another Image
               </Button>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-xl font-semibold">Result</h3>
              <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center p-2 border-2 border-dashed border-gray-600" style={{ backgroundImage: 'repeating-conic-gradient(#374151 0 25%, transparent 0 50%)', backgroundSize: '20px 20px'}}>
                {isLoading && <Spinner size="lg" />}
                {!isLoading && resultImage && (
                  <img src={resultImage} alt="Background removed" className="max-w-full max-h-full object-contain" />
                )}
                {!isLoading && !resultImage && !error && (
                    <p className="text-gray-500">Result will appear here</p>
                )}
                {error && <p className="text-red-400 text-sm p-4 text-center">{error}</p>}
              </div>
              <Button onClick={() => {
                  if(!resultImage) return;
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = 'background-removed.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }} disabled={!resultImage || isLoading} icon={<Icon type="download"/>}>
                Save Image
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveBackgroundPanel;