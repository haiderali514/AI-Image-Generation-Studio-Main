import React, { useState, useRef, useCallback } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Canvas, { CanvasHandle } from '../ui/Canvas';
import * as geminiService from '../../services/geminiService';
import Icon from '../ui/Icon';
// FIX: Import EditorTool to use for the Canvas component's activeTool prop.
import { Tool, EditorTool } from '../../types';

const CANVAS_SIZE = 512;
type BrushShape = 'round' | 'butt' | 'square';

const DrawToImagePanel: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [brushColor, setBrushColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushShape, setBrushShape] = useState<BrushShape>('round');
  const [clearCanvasToken, setClearCanvasToken] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  const handleClearCanvas = useCallback(() => {
    setClearCanvasToken(prev => prev + 1);
  }, []);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt to guide the AI.');
      return;
    }
    const drawingCanvas = canvasRef.current?.getCanvas();
    if (!drawingCanvas) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = CANVAS_SIZE;
    compositeCanvas.height = CANVAS_SIZE;
    const ctx = compositeCanvas.getContext('2d');
    
    if (ctx) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(drawingCanvas, 0, 0);
    }
    
    const drawingDataUrl = compositeCanvas.toDataURL('image/png');

    try {
      const imageUrl = await geminiService.generateImageFromDraw(drawingDataUrl, 'image/png', prompt);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'draw-to-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
        const newSuggestions = await geminiService.getPromptSuggestions(Tool.DRAW_TO_IMAGE, prompt);
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
            <h2 className="text-2xl font-bold text-indigo-400 self-start">Sketch Your Idea</h2>
            {/* FIX: Add the required 'activeTool' prop to the Canvas component. */}
            <Canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} brushColor={brushColor} brushSize={brushSize} brushOpacity={brushOpacity} brushShape={brushShape} clearToken={clearCanvasToken} onHistoryChange={setHistoryState} activeTool={EditorTool.BRUSH}/>
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg w-full max-w-[512px] space-y-4">
                <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-3">
                    <label htmlFor="brushColor" className="text-sm font-medium text-gray-300">Color</label>
                    <input type="color" id="brushColor" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-gray-700 justify-self-start"/>
                    
                    <label htmlFor="brushSize" className="text-sm font-medium text-gray-300">Size</label>
                    <input type="range" id="brushSize" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                    
                    <label htmlFor="brushOpacity" className="text-sm font-medium text-gray-300">Opacity</label>
                    <div className="flex items-center gap-3">
                      <input type="range" id="brushOpacity" min="0.05" max="1" step="0.05" value={brushOpacity} onChange={e => setBrushOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                      <span className="text-xs w-10 text-center text-gray-400">{(brushOpacity * 100).toFixed(0)}%</span>
                    </div>

                    <label className="text-sm font-medium text-gray-300">Shape</label>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setBrushShape('round')} className={`p-1.5 rounded-md transition-colors ${brushShape === 'round' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} aria-label="Round brush tip" title="Round brush tip"><Icon type="brush-round" /></button>
                        <button onClick={() => setBrushShape('square')} className={`p-1.5 rounded-md transition-colors ${brushShape === 'square' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} aria-label="Square brush tip" title="Square brush tip"><Icon type="brush-square" /></button>
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-700">
                    <Button onClick={() => canvasRef.current?.undo()} disabled={!historyState.canUndo} variant="secondary" icon={<Icon type="undo" />} aria-label="Undo" title="Undo (Ctrl+Z)" />
                    <Button onClick={() => canvasRef.current?.redo()} disabled={!historyState.canRedo} variant="secondary" icon={<Icon type="redo" />} aria-label="Redo" title="Redo (Ctrl+Y)" />
                    <Button onClick={handleClearCanvas} variant="secondary" icon={<Icon type="clear" />} title="Clear entire canvas">Clear</Button>
                </div>
            </div>
        </div>

        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-indigo-400">Add a Prompt</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what the sketch should become, e.g., 'A photorealistic cat sitting on a windowsill'"
            className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            disabled={isLoading}
          />
          <div className="flex flex-col space-y-2">
            <Button onClick={handleSuggest} isLoading={isSuggesting} variant="secondary" icon={<Icon type="sparkle"/>} className="self-start">
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
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt} className="w-full !py-3">
            Generate from Sketch
          </Button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <div className="flex-1 flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg w-full aspect-square relative">
             {isLoading && <Spinner size="lg" />}
             {!isLoading && generatedImage && (
                <>
                  <img src={generatedImage} alt="Generated from drawing" className="object-contain max-w-full max-h-full rounded-md" />
                  <Button onClick={handleDownload} variant="secondary" className="absolute bottom-4 right-4" icon={<Icon type="download" />} title="Download image">
                    Save Image
                  </Button>
                </>
             )}
             {!isLoading && !generatedImage && <p className="text-gray-500">Result will be shown here</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawToImagePanel;