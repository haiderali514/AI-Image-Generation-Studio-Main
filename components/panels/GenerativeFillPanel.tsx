import React, { useState, useRef, useCallback } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Canvas, { CanvasHandle } from '../ui/Canvas';
import ImageUpload from '../ui/ImageUpload';
import * as geminiService from '../../services/geminiService';
import { fileToBase64 } from '../../utils/imageUtils';
import Icon from '../ui/Icon';
import { Tool } from '../../types';

const CANVAS_SIZE = 512;
const MASK_COLOR = "#FF00FF"; // Bright pink for masking
type BrushShape = 'round' | 'butt' | 'square';


const GenerativeFillPanel: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [brushOpacity, setBrushOpacity] = useState(0.5);
  const [brushShape, setBrushShape] = useState<BrushShape>('round');
  const [clearToken, setClearToken] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });


  const handleImageUpload = async (file: File) => {
    setUploadedImage(file);
    const base64 = await fileToBase64(file);
    setImageBase64(base64);
    setResultImage(null);
  };
  
  const handleClearMask = useCallback(() => {
    setClearToken(prev => prev + 1);
  }, []);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt to fill the masked area.');
      return;
    }
    const maskCanvas = canvasRef.current?.getCanvas();
    if (!maskCanvas || !uploadedImage || !imageBase64) return;

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    
    // 1. Create a canvas for the final composite image
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = CANVAS_SIZE;
    compositeCanvas.height = CANVAS_SIZE;
    const compositeCtx = compositeCanvas.getContext('2d');
    if (!compositeCtx) {
        setIsLoading(false);
        return;
    };

    // 2. Draw the original image onto it, maintaining aspect ratio
    const img = new Image();
    img.src = imageBase64;
    await new Promise(resolve => img.onload = resolve);
      
    const aspectRatio = img.width / img.height;
    let newWidth = CANVAS_SIZE;
    let newHeight = CANVAS_SIZE;
    if (CANVAS_SIZE / CANVAS_SIZE > aspectRatio) {
        newWidth = CANVAS_SIZE * aspectRatio;
    } else {
        newHeight = CANVAS_SIZE / aspectRatio;
    }
    const xOffset = (CANVAS_SIZE - newWidth) / 2;
    const yOffset = (CANVAS_SIZE - newHeight) / 2;
    compositeCtx.drawImage(img, xOffset, yOffset, newWidth, newHeight);

    // 3. Process the mask to be solid pink
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        setIsLoading(false);
        return;
    }
    const imageData = maskCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // if pixel is not transparent, it's part of the mask
        if (data[i + 3] > 0) {
            data[i] = 255;     // R
            data[i + 1] = 0;   // G
            data[i + 2] = 255; // B
            data[i + 3] = 255; // A (solid)
        }
    }
    
    // 4. Draw the solidified mask on top of the original image
    const solidMaskCanvas = document.createElement('canvas');
    solidMaskCanvas.width = CANVAS_SIZE;
    solidMaskCanvas.height = CANVAS_SIZE;
    solidMaskCanvas.getContext('2d')?.putImageData(imageData, 0, 0);
    
    compositeCtx.drawImage(solidMaskCanvas, 0, 0);

    const maskedImageDataUrl = compositeCanvas.toDataURL(uploadedImage.type);

    try {
      const imageUrl = await geminiService.generativeFill(maskedImageDataUrl, uploadedImage.type, prompt);
      setResultImage(imageUrl);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'generative-fill-result.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
        const newSuggestions = await geminiService.getPromptSuggestions(Tool.GENERATIVE_FILL, prompt);
        setSuggestions(newSuggestions);
    } catch (err) {
        setError('Could not fetch suggestions.');
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <div className="flex flex-col space-y-4 items-center">
            <h2 className="text-2xl font-bold text-indigo-400 self-start">Mask Your Image</h2>
            {!imageBase64 ? (
              <ImageUpload onUpload={handleImageUpload} title="Upload an image to start" />
            ) : (
              <>
                <Canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} backgroundImage={imageBase64} brushColor={MASK_COLOR} brushSize={brushSize} brushOpacity={brushOpacity} brushShape={brushShape} clearToken={clearToken} onHistoryChange={setHistoryState} />
                <div className="flex flex-col space-y-3 p-3 bg-gray-800 rounded-lg w-full max-w-[512px]">
                   <div className="flex items-center space-x-3">
                      <label htmlFor="brushSizeFill" className="text-sm font-medium text-gray-300">Size</label>
                      <input type="range" id="brushSizeFill" min="5" max="100" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                   </div>
                   <div className="flex items-center space-x-3">
                      <label htmlFor="brushOpacityFill" className="text-sm font-medium text-gray-300">Opacity</label>
                      <input type="range" id="brushOpacityFill" min="0.05" max="1" step="0.05" value={brushOpacity} onChange={e => setBrushOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                      <span className="text-xs w-10 text-center text-gray-400">{(brushOpacity * 100).toFixed(0)}%</span>
                   </div>
                   <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                           <label className="text-sm font-medium text-gray-300">Shape</label>
                           <div className="flex items-center space-x-2">
                               <button onClick={() => setBrushShape('round')} className={`p-1.5 rounded-md transition-colors ${brushShape === 'round' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} aria-label="Round brush tip"><Icon type="brush-round" /></button>
                               <button onClick={() => setBrushShape('square')} className={`p-1.5 rounded-md transition-colors ${brushShape === 'square' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} aria-label="Square brush tip"><Icon type="brush-square" /></button>
                           </div>
                       </div>
                       <div className="flex items-center space-x-2">
                          <Button onClick={() => canvasRef.current?.undo()} disabled={!historyState.canUndo} variant="secondary" icon={<Icon type="undo" />} aria-label="Undo" />
                          <Button onClick={() => canvasRef.current?.redo()} disabled={!historyState.canRedo} variant="secondary" icon={<Icon type="redo" />} aria-label="Redo" />
                          <Button onClick={handleClearMask} variant="secondary" icon={<Icon type="clear" />}>Clear Mask</Button>
                       </div>
                   </div>
                </div>
              </>
            )}
        </div>

        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400">Describe the Fill</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'a field of sunflowers', 'a futuristic city skyline', 'two curious cats'"
            className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            disabled={isLoading || !imageBase64}
          />
          <div className="flex flex-col space-y-2">
            <Button onClick={handleSuggest} isLoading={isSuggesting} variant="secondary" icon={<Icon type="sparkle"/>} className="self-start" disabled={!imageBase64}>
              Suggest Ideas
            </Button>
            {isSuggesting && <Spinner size="sm" className="mt-2" />}
            {suggestions.length > 0 && !isSuggesting && (
              <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="bg-gray-700 text-gray-200 hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt || !imageBase64}>
            Generate Fill
          </Button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex-1 flex items-center justify-center bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg min-h-[300px] lg:min-h-[512px] relative">
             {isLoading && <Spinner size="lg" />}
             {!isLoading && resultImage && (
                <>
                  <img src={resultImage} alt="Generative fill result" className="object-contain max-w-full max-h-full rounded-md" />
                  <Button onClick={handleDownload} variant="secondary" className="absolute bottom-4 right-4" icon={<Icon type="download" />}>
                    Save Image
                  </Button>
                </>
             )}
             {!isLoading && !resultImage && <p className="text-gray-500">Result will be shown here</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerativeFillPanel;