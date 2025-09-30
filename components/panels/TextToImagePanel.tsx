import React, { useState } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import * as geminiService from '../../services/geminiService';
import Icon from '../ui/Icon';
import { Tool } from '../../types';

const aspectRatioPresets = [
  { name: '1:1', label: 'Square', width: 1024, height: 1024 },
  { name: '16:9', label: 'Landscape', width: 1024, height: 576 },
  { name: '9:16', label: 'Portrait', width: 576, height: 1024 },
  { name: '4:3', label: 'Standard', width: 1024, height: 768 },
  { name: '3:4', label: 'Classic', width: 768, height: 1024 },
];

const TextToImagePanel: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>('1:1');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const checkActivePreset = (w: number, h: number) => {
    const matchingPreset = aspectRatioPresets.find(p => p.width === w && p.height === h);
    setActivePreset(matchingPreset ? matchingPreset.name : null);
  };

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    checkActivePreset(newWidth, height);
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    checkActivePreset(width, newHeight);
  };
  
  const handlePresetClick = (preset: typeof aspectRatioPresets[0]) => {
    setWidth(preset.width);
    setHeight(preset.height);
    setActivePreset(preset.name);
  };

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
     if (width <= 0 || height <= 0) {
      setError('Width and height must be positive numbers.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await geminiService.generateImageFromText(prompt, width, height);
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
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const newSuggestions = await geminiService.getPromptSuggestions(Tool.TEXT_TO_IMAGE, prompt);
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
        <div className="flex flex-col space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-indigo-400">Describe Your Vision</h2>
            <p className="text-gray-400 mt-1">Enter a detailed description of the image you want to create.</p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic shot of a raccoon astronaut on a neon-lit alien planet, detailed, 8k"
            className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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

          <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-300">Image Settings</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">Aspect Ratio</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {aspectRatioPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className={`py-2 px-3 text-sm rounded-md transition-colors duration-200 text-center ${
                      activePreset === preset.name
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs opacity-80">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-400 mb-1">Width (px)</label>
                <input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g., 1024"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-400 mb-1">Height (px)</label>
                <input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g., 1024"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt || !width || !height} className="w-full !py-3">
            Generate Image
          </Button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
        
        <div className="flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg h-full w-full aspect-square relative">
          {isLoading && <Spinner size="lg" />}
          {!isLoading && generatedImage && (
            <>
              <img src={generatedImage} alt="Generated" className="object-contain max-w-full max-h-full rounded-md" />
              <Button onClick={handleDownload} variant="secondary" className="absolute bottom-4 right-4" icon={<Icon type="download" />}>
                Save Image
              </Button>
            </>
          )}
          {!isLoading && !generatedImage && (
            <div className="text-center text-gray-500 flex flex-col items-center">
              <Icon type="logo" className="w-16 h-16 opacity-20 mb-2"/>
              <p className="font-semibold">Your generated image will appear here</p>
              <p className="text-sm">Let your creativity flow!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToImagePanel;
