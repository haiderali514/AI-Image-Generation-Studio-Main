
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DocumentSettings, EditorTool, Layer, BrushShape, TextAlign } from '../../types';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import Toolbar from './Toolbar';
import ToolsPanel from './ToolsPanel';
import LayersPanel from './LayersPanel';
import TopToolbar from './TopToolbar';

interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
}

const ZOOM_STEP = 0.1;
const MAX_ZOOM = 16; // 1600%
const MIN_ZOOM = 0.1; // 10%

/**
 * The main container for the entire editor UI.
 * It orchestrates the header, toolbar, canvas, and properties panel.
 */
const Editor: React.FC<EditorProps> = ({ document, onClose }) => {
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.BRUSH);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Initialize with a single layer
  useEffect(() => {
    const initialLayer: Layer = {
      id: crypto.randomUUID(),
      name: 'Layer 1',
      isVisible: true,
      isLocked: false,
      opacity: 1,
      blendMode: 'normal',
      history: [null],
      historyIndex: 0,
    };
    setLayers([initialLayer]);
    setActiveLayerId(initialLayer.id);
  }, [document]);

  // --- Tool settings state ---
  // Color
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  
  // Brush & Eraser
  const [brushSize, setBrushSize] = useState(25);
  const [brushHardness, setBrushHardness] = useState(1);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushShape, setBrushShape] = useState<BrushShape>('round');
  
  // Text
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [fontSize, setFontSize] = useState(48);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');

  const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId), [layers, activeLayerId]);
  
  // Keyboard shortcuts for color management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleSwapColors();
      }
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleResetColors();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [foregroundColor, backgroundColor]); // Rerun if colors change to get latest values in closure

  const handleSwapColors = () => {
      setForegroundColor(backgroundColor);
      setBackgroundColor(foregroundColor);
  };
  const handleResetColors = () => {
      setForegroundColor('#000000');
      setBackgroundColor('#FFFFFF');
  };

  const handleZoom = (update: number | 'in' | 'out' | 'reset') => {
    setZoom(prev => {
        let newZoom = prev;
        if (update === 'in') newZoom = prev + ZOOM_STEP;
        else if (update === 'out') newZoom = prev - ZOOM_STEP;
        else if (update === 'reset') newZoom = 1;
        else if (typeof update === 'number') newZoom = update;
        return Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
    });
  };

  const handleDrawEnd = (imageData: ImageData) => {
    if (!activeLayerId) return;
    setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id === activeLayerId) {
            const newHistory = layer.history.slice(0, layer.historyIndex + 1);
            newHistory.push(imageData);
            return {
                ...layer,
                history: newHistory,
                historyIndex: newHistory.length - 1,
            };
        }
        return layer;
    }));
  };

  const handleUndo = () => {
    setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id === activeLayerId && layer.historyIndex > 0) {
            return { ...layer, historyIndex: layer.historyIndex - 1 };
        }
        return layer;
    }));
  };
  const handleRedo = () => {
    setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id === activeLayerId && layer.historyIndex < layer.history.length - 1) {
            return { ...layer, historyIndex: layer.historyIndex + 1 };
        }
        return layer;
    }));
  };
  
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${layers.length + 1}`,
        isVisible: true,
        isLocked: false,
        opacity: 1,
        blendMode: 'normal',
        history: [null],
        historyIndex: 0,
    };
    
    const activeIndex = activeLayerId ? layers.findIndex(l => l.id === activeLayerId) : -1;
    const newLayers = [...layers];
    newLayers.splice(activeIndex + 1, 0, newLayer);
    
    setLayers(newLayers);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = () => {
    if (layers.length <= 1) return; // Can't delete the last layer
    const activeIndex = layers.findIndex(l => l.id === activeLayerId);
    const newLayers = layers.filter(l => l.id !== activeLayerId);
    
    let newActiveId = null;
    if (newLayers.length > 0) {
        newActiveId = newLayers[Math.max(0, activeIndex -1)]?.id;
    }
    
    setLayers(newLayers);
    setActiveLayerId(newActiveId);
  };
  
  const handleUpdateLayerProps = (id: string, props: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...props } : l));
  };


  const handleSelectionChange = (rect: {x:number, y:number, width:number, height:number} | null) => {
    if (rect) {
      setSelection({ rect });
    } else {
      setSelection(null);
    }
  };

  const handleToolSelect = (tool: EditorTool) => {
    // Clear selection when changing tool for a cleaner workflow
    if (selection) {
      setSelection(null);
    }
    setActiveTool(tool);
  };
  
  const canUndo = activeLayer ? activeLayer.historyIndex > 0 : false;
  const canRedo = activeLayer ? activeLayer.historyIndex < activeLayer.history.length - 1 : false;

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-100 font-sans">
      <EditorHeader
        documentName={document.name}
        onClose={onClose}
        zoom={zoom}
        onZoom={handleZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Toolbar 
            activeTool={activeTool} 
            onToolSelect={handleToolSelect} 
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            onSetForegroundColor={setForegroundColor}
            onSetBackgroundColor={setBackgroundColor}
            onSwapColors={handleSwapColors}
            onResetColors={handleResetColors}
        />
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
           <TopToolbar
              activeTool={activeTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushHardness={brushHardness}
              setBrushHardness={setBrushHardness}
              brushOpacity={brushOpacity}
              setBrushOpacity={setBrushOpacity}
              brushShape={brushShape}
              setBrushShape={setBrushShape}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              fontSize={fontSize}
              setFontSize={setFontSize}
              textAlign={textAlign}
              setTextAlign={setTextAlign}
           />
          <CanvasArea
            document={document}
            layers={layers}
            activeLayerId={activeLayerId}
            activeTool={activeTool}
            zoom={zoom}
            onZoom={handleZoom}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            onDrawEnd={handleDrawEnd}
            foregroundColor={foregroundColor}
            brushSize={brushSize}
            brushOpacity={brushOpacity}
            brushHardness={brushHardness}
            brushShape={brushShape}
            fontFamily={fontFamily}
            fontSize={fontSize}
            textAlign={textAlign}
          />
        </main>
        <aside className="w-72 bg-[#252525] flex flex-col border-l border-black/20 p-2 space-y-2 overflow-y-auto">
            <ToolsPanel activeTool={activeTool} />
            <LayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onSelectLayer={setActiveLayerId}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onUpdateLayerProps={handleUpdateLayerProps}
            />
        </aside>
      </div>
    </div>
  );
};

export default Editor;
