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

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!originalImageBase64) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-indigo-400 mb-2">Remove Background</h2>
        <p className="text-gray-400 mb-6">Upload an image and the AI will automatically remove the background, leaving you with a clean, transparent result.</p>
        <ImageUpload onUpload={handleImageUpload} title="PNG, JPG, WEBP accepted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-indigo-400 mb-6">Remove Background</h2>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-300">Original Image</h3>
          <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center p-2 border border-gray-700/50">
            <img src={originalImageBase64} alt="Original" className="max-w-full max-h-full object-contain rounded-md" />
          </div>
           <div className="w-full flex flex-col space-y-2">
            <Button onClick={handleRemoveBackground} isLoading={isLoading} className="!py-3">
              Remove Background
            </Button>
            <Button onClick={() => setOriginalImageBase64(null)} variant="secondary" disabled={isLoading}>
              Upload Another Image
            </Button>
           </div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-300">Result</h3>
          <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center p-2 border-2 border-dashed border-gray-700" style={{ backgroundImage: 'repeating-conic-gradient(#374151 0 25%, transparent 0 50%)', backgroundSize: '20px 20px'}}>
            {isLoading && <Spinner size="lg" />}
            {!isLoading && resultImage && (
              <img src={resultImage} alt="Background removed" className="max-w-full max-h-full object-contain" />
            )}
            {!isLoading && !resultImage && !error && (
                <p className="text-gray-500 font-semibold">Result will appear here</p>
            )}
            {error && <p className="text-red-400 text-sm p-4 text-center">{error}</p>}
          </div>
          <Button onClick={handleDownload} disabled={!resultImage || isLoading} icon={<Icon type="download"/>} className="w-full" title="Download image with transparent background">
            Save Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RemoveBackgroundPanel;