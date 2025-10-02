

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DocumentSettings, EditorTool, Layer, BrushShape, TextAlign, BlendMode, AutoSelectType } from '../../types';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import ConfirmModal from '../modals/ConfirmModal';
import { generateThumbnail } from '../../utils/imageUtils';
// FIX: Import the LayersPanel component to resolve the 'Cannot find name' error.
import LayersPanel from './LayersPanel';

interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
  onNew: () => void;
}

const MAX_ZOOM = 32; // 3200%
const MIN_ZOOM = 0.05; // 5%

// FIX: Renamed the destructured `document` prop to `documentSettings` to avoid shadowing the global `document` object.
const Editor: React.FC<EditorProps> = ({ document: documentSettings, onClose, onNew }) => {
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.MOVE);
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isBgConvertModalOpen, setIsBgConvertModalOpen] = useState(false);

  // Initialize with a single background layer
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = documentSettings.width;
    canvas.height = documentSettings.height;
    const ctx = canvas.getContext('2d');
    let initialImageData: ImageData | null = null;
    if (ctx) {
      if (documentSettings.background !== 'Transparent') {
        ctx.fillStyle = documentSettings.background === 'Custom' ? documentSettings.customBgColor : documentSettings.background.toLowerCase();
        ctx.fillRect(0, 0, documentSettings.width, documentSettings.height);
        initialImageData = ctx.getImageData(0, 0, documentSettings.width, documentSettings.height);
      }
    }

    const backgroundLayer: Layer = {
      id: crypto.randomUUID(),
      name: 'Background',
      isVisible: true,
      isLocked: true,
      isBackground: true,
      opacity: 1,
      blendMode: 'normal',
      history: [initialImageData],
      historyIndex: 0,
      thumbnail: generateThumbnail(initialImageData, 48, 40),
    };
    setLayers([backgroundLayer]);
    setActiveLayerId(backgroundLayer.id);
  }, [documentSettings]);

  // --- Tool settings state ---
  const [autoSelect, setAutoSelect] = useState<AutoSelectType>('Layer');

  const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId), [layers, activeLayerId]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selection) {
          setSelection(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection]);

  const handleZoom = (update: number | 'in' | 'out' | 'reset') => {
    setZoom(prev => {
        let newZoom = prev;
        if (update === 'in') newZoom = prev * 1.25;
        else if (update === 'out') newZoom = prev / 1.25;
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
                thumbnail: generateThumbnail(imageData, 48, 40),
            };
        }
        return layer;
    }));
  };

  const handleUndo = () => {
    setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id === activeLayerId && layer.historyIndex > 0) {
            const newIndex = layer.historyIndex - 1;
            return { 
              ...layer, 
              historyIndex: newIndex,
              thumbnail: generateThumbnail(layer.history[newIndex], 48, 40)
            };
        }
        return layer;
    }));
  };
  const handleRedo = () => {
    setLayers(prevLayers => prevLayers.map(layer => {
        if (layer.id === activeLayerId && layer.historyIndex < layer.history.length - 1) {
            const newIndex = layer.historyIndex + 1;
            return { 
              ...layer, 
              historyIndex: newIndex,
              thumbnail: generateThumbnail(layer.history[newIndex], 48, 40),
            };
        }
        return layer;
    }));
  };
  
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${layers.length}`,
        isVisible: true,
        isLocked: false,
        opacity: 1,
        blendMode: 'normal',
        history: [null],
        historyIndex: 0,
        thumbnail: generateThumbnail(null, 48, 40),
    };
    
    const activeIndex = activeLayerId ? layers.findIndex(l => l.id === activeLayerId) : -1;
    const newLayers = [...layers];
    if (activeIndex !== -1) {
      newLayers.splice(activeIndex + 1, 0, newLayer);
    } else {
      newLayers.push(newLayer);
    }
    
    setLayers(newLayers);
    setActiveLayerId(newLayer.id);
  };

  const handleDeleteLayer = () => {
    if (layers.length <= 1) return;
    const layerToDelete = layers.find(l => l.id === activeLayerId);
    if (layerToDelete?.isBackground) return;

    const activeIndex = layers.findIndex(l => l.id === activeLayerId);
    const newLayers = layers.filter(l => l.id !== activeLayerId);
    
    let newActiveId = null;
    if (newLayers.length > 0) {
        newActiveId = newLayers[Math.min(newLayers.length - 1, activeIndex)]?.id;
    }
    
    setLayers(newLayers);
    setActiveLayerId(newActiveId);
  };
  
  const handleUpdateLayerProps = (id: string, props: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...props } : l));
  };

  const handleSelectionChange = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(null);
    if (rect) {
      setSelection({ rect });
    } else {
      setSelection(null);
    }
  };
  
  const handleSelectionPreview = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(rect ? { rect } : null);
  };

  const handleToolSelect = (tool: EditorTool) => {
    setSelectionPreview(null);

    if (tool === activeTool) {
      // If the same tool is clicked, toggle the panel
      setIsPropertiesPanelOpen(prev => !prev);
    } else {
      // If a different tool is clicked, activate it and ensure the panel is open
      setActiveTool(tool);
      setIsPropertiesPanelOpen(true);
    }
  };

  const handleAttemptEditBackground = () => {
    setIsBgConvertModalOpen(true);
  };

  const handleConfirmConvertToLayer = () => {
    setLayers(prev => prev.map(l => {
        if (l.isBackground) {
            return {
                ...l,
                name: 'Layer 0',
                isLocked: false,
                isBackground: false,
            };
        }
        return l;
    }));
    setIsBgConvertModalOpen(false);
  };
  
  const canUndo = activeLayer ? activeLayer.historyIndex > 0 : false;
  const canRedo = activeLayer ? activeLayer.historyIndex < activeLayer.history.length - 1 : false;

  const handleSaveAs = () => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = documentSettings.width;
    compositeCanvas.height = documentSettings.height;
    const compositeCtx = compositeCanvas.getContext('2d');
    if (!compositeCtx) return;

    if (documentSettings.background !== 'Transparent') {
        compositeCtx.fillStyle = documentSettings.background === 'Custom' ? documentSettings.customBgColor : documentSettings.background.toLowerCase();
        compositeCtx.fillRect(0, 0, documentSettings.width, documentSettings.height);
    }
  
    // Draw layers from bottom to top
    layers.forEach(layer => {
      if (layer.isVisible) {
        const layerImageData = layer.history[layer.historyIndex];
        if (layerImageData) {
          const layerCanvas = document.createElement('canvas');
          layerCanvas.width = documentSettings.width;
          layerCanvas.height = documentSettings.height;
          const layerCtx = layerCanvas.getContext('2d');
          if (layerCtx) {
            layerCtx.putImageData(layerImageData, 0, 0);
  
            // FIX: Map 'normal' blend mode to 'source-over' to match the Canvas API's `globalCompositeOperation` valid values.
            compositeCtx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
            compositeCtx.globalAlpha = layer.opacity;
            compositeCtx.drawImage(layerCanvas, 0, 0);
          }
        }
      }
    });

    compositeCtx.globalAlpha = 1;
    compositeCtx.globalCompositeOperation = 'source-over';
  
    const dataUrl = compositeCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${documentSettings.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex flex-col h-screen bg-[#181818] text-gray-300 font-sans text-sm">
      <EditorHeader
        documentName={documentSettings.name}
        onClose={onClose}
        onNew={onNew}
        onSaveAs={handleSaveAs}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
      />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />
        {isPropertiesPanelOpen && (
            <PropertiesPanel 
              activeTool={activeTool}
              autoSelect={autoSelect}
              onAutoSelectChange={setAutoSelect}
              onClose={() => setIsPropertiesPanelOpen(false)}
            />
        )}
        <main className="flex-1 flex flex-col bg-[#181818] overflow-hidden">
          <CanvasArea
            document={documentSettings}
            layers={layers}
            activeLayerId={activeLayerId}
            activeTool={activeTool}
            zoom={zoom}
            onZoom={handleZoom}
            selection={selection}
            onSelectionChange={handleSelectionChange}
            selectionPreview={selectionPreview}
            onSelectionPreview={handleSelectionPreview}
            onDrawEnd={handleDrawEnd}
            onAttemptEditBackgroundLayer={handleAttemptEditBackground}
            // Pass dummy tool props since they are not used anymore
            foregroundColor="#000" brushSize={10} brushOpacity={1} brushHardness={1}
            brushShape="round" fontFamily="sans-serif" fontSize={12} textAlign="left"
          />
        </main>
        <LayersPanel
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onUpdateLayerProps={handleUpdateLayerProps}
        />
      </div>
      <ConfirmModal
        isOpen={isBgConvertModalOpen}
        onClose={() => setIsBgConvertModalOpen(false)}
        onConfirm={handleConfirmConvertToLayer}
        title="Convert Background Layer?"
        confirmText="Convert to Layer"
      >
        <p>The Background layer is locked. To make changes, please convert it to a normal layer.</p>
      </ConfirmModal>
    </div>
  );
};

export default Editor;