

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentSettings, EditorTool, Layer, TransformSubTool, BrushShape, PaintSubTool, AnySubTool } from '../../types';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import ConfirmModal from '../modals/ConfirmModal';
import ExportModal, { ExportFormat } from '../modals/ExportModal';
import { generateThumbnail, fileToBase64, base64ToImageData } from '../../utils/imageUtils';
import { saveProject, loadProject } from '../../utils/projectUtils';
import LayersPanel from './LayersPanel';

interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
  onNew: () => void;
  initialFile?: File | null;
}

interface TransformSession {
    layerId: string;
    initialLayerState: Layer;
    transform: DOMMatrix;
    isAspectRatioLocked: boolean;
}

interface MoveSession {
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    layerStartX: number;
    layerStartY: number;
}

const MAX_ZOOM = 32; // 3200%
const MIN_ZOOM = 0.05; // 5%

const Editor: React.FC<EditorProps> = ({ document: initialDocumentSettings, onClose, onNew, initialFile }) => {
  const [docSettings, setDocSettings] = useState(initialDocumentSettings);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.TRANSFORM);
  const [activeSubTool, setActiveSubTool] = useState<AnySubTool>('move');
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);

  const [history, setHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  const [isBgConvertModalOpen, setIsBgConvertModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transformSession, setTransformSession] = useState<TransformSession | null>(null);
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);

  // Tool settings state
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [brushSettings, setBrushSettings] = useState({
    size: 30,
    hardness: 0.8,
    opacity: 1,
    shape: 'round' as BrushShape,
  });

  const currentLayers = useMemo(() => history[historyIndex] ?? [], [history, historyIndex]);
  const activeLayer = useMemo(() => currentLayers.find(l => l.id === activeLayerId), [currentLayers, activeLayerId]);

  const commit = useCallback((newLayers: Layer[], newActiveLayerId?: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLayers);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    if (newActiveLayerId) {
        setActiveLayerId(newActiveLayerId);
    }
  }, [history, historyIndex]);

  // Initialize with a single background layer
  useEffect(() => {
    const init = async () => {
        let initialImageData: ImageData | null = null;
        if (initialDocumentSettings.background !== 'Transparent') {
            const canvas = document.createElement('canvas');
            canvas.width = initialDocumentSettings.width;
            canvas.height = initialDocumentSettings.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = initialDocumentSettings.background === 'Custom' ? initialDocumentSettings.customBgColor : initialDocumentSettings.background.toLowerCase();
                ctx.fillRect(0, 0, initialDocumentSettings.width, initialDocumentSettings.height);
                initialImageData = ctx.getImageData(0, 0, initialDocumentSettings.width, initialDocumentSettings.height);
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
            imageData: initialImageData,
            thumbnail: generateThumbnail(initialImageData, 48, 40),
            x: 0,
            y: 0,
        };
        
        let initialLayers = [backgroundLayer];
        let initialActiveId = backgroundLayer.id;

        if (initialFile) {
            const base64 = await fileToBase64(initialFile);
            const imageData = await base64ToImageData(base64, initialDocumentSettings.width, initialDocumentSettings.height);
            const imageLayer: Layer = {
                id: crypto.randomUUID(),
                name: initialFile.name.split('.').slice(0, -1).join('.') || 'Layer 1',
                isVisible: true,
                isLocked: false,
                imageData: imageData,
                opacity: 1,
                blendMode: 'normal',
                thumbnail: generateThumbnail(imageData, 48, 40),
                x: 0,
                y: 0,
            };
            initialLayers.push(imageLayer);
            initialActiveId = imageLayer.id;
        }

        setHistory([initialLayers]);
        setHistoryIndex(0);
        setActiveLayerId(initialActiveId);
    };
    init();
  }, [initialDocumentSettings, initialFile]);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selection) setSelection(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
       if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleRedo();
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

  const handleDrawEnd = (strokesImageData: ImageData) => {
    if (!activeLayerId) return;
    
    const activeLayer = currentLayers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;

    // This creates a new canvas that contains the layer's existing image data
    // plus the new stroke drawn by the user.
    const canvas = document.createElement('canvas');
    canvas.width = docSettings.width;
    canvas.height = docSettings.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // 1. Draw the original layer content
    if (activeLayer.imageData) {
        ctx.putImageData(activeLayer.imageData, 0, 0);
    }
    
    // 2. Draw the new stroke on top, using the correct composite operation (for eraser)
    ctx.globalCompositeOperation = activeSubTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.drawImage(strokesImageData.canvas, 0, 0);

    // 3. Get the merged result
    const newImageData = ctx.getImageData(0, 0, docSettings.width, docSettings.height);

    const newLayers = currentLayers.map(layer => {
        if (layer.id === activeLayerId) {
            return { ...layer, imageData: newImageData, thumbnail: generateThumbnail(newImageData, 48, 40) };
        }
        return layer;
    });
    commit(newLayers);
  };

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex - 1);
  };
  
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${currentLayers.length}`,
        isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal',
        imageData: null, thumbnail: generateThumbnail(null, 48, 40),
        x: 0,
        y: 0,
    };
    
    const activeIndex = activeLayerId ? currentLayers.findIndex(l => l.id === activeLayerId) : -1;
    const newLayers = [...currentLayers];
    newLayers.splice(activeIndex + 1, 0, newLayer);
    commit(newLayers, newLayer.id);
  };

  const handleDeleteLayer = () => {
    if (currentLayers.length <= 1 || activeLayer?.isBackground) return;
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    const newLayers = currentLayers.filter(l => l.id !== activeLayerId);
    let newActiveId = null;
    if (newLayers.length > 0) {
        newActiveId = newLayers[Math.max(0, Math.min(newLayers.length - 1, activeIndex -1))]?.id;
    }
    commit(newLayers, newActiveId ?? undefined);
  };
  
  const handleUpdateLayerProps = (id: string, props: Partial<Layer>) => {
    const newLayers = currentLayers.map(l => l.id === id ? { ...l, ...props } : l);
    commit(newLayers);
  };
  
  const handleUpdateLayerPosition = (id: string, x: number, y: number) => {
    const newLayers = currentLayers.map(l => l.id === id ? { ...l, x: Math.round(x), y: Math.round(y) } : l);
    commit(newLayers);
  };

  const handleDuplicateLayer = () => {
    if (!activeLayer) return;
    const newLayer: Layer = {
        ...activeLayer,
        id: crypto.randomUUID(),
        name: `${activeLayer.name} copy`,
    };
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    const newLayers = [...currentLayers];
    newLayers.splice(activeIndex + 1, 0, newLayer);
    commit(newLayers, newLayer.id);
  };

  const handleMergeDown = () => {
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    if (activeIndex <= 0) return; // Cannot merge down if it's the bottom layer
    const topLayer = currentLayers[activeIndex];
    const bottomLayer = currentLayers[activeIndex - 1];

    const canvas = document.createElement('canvas');
    canvas.width = docSettings.width;
    canvas.height = docSettings.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw bottom layer at its position
    if (bottomLayer.imageData) {
        const bottomCanvas = document.createElement('canvas');
        bottomCanvas.width = docSettings.width;
        bottomCanvas.height = docSettings.height;
        bottomCanvas.getContext('2d')?.putImageData(bottomLayer.imageData, 0, 0);
        ctx.drawImage(bottomCanvas, bottomLayer.x, bottomLayer.y);
    }

    // Draw top layer at its position
    if (topLayer.imageData) {
        ctx.globalAlpha = topLayer.opacity;
        ctx.globalCompositeOperation = topLayer.blendMode === 'normal' ? 'source-over' : topLayer.blendMode;
        
        const topCanvas = document.createElement('canvas');
        topCanvas.width = docSettings.width;
        topCanvas.height = docSettings.height;
        topCanvas.getContext('2d')?.putImageData(topLayer.imageData, 0, 0);
        ctx.drawImage(topCanvas, topLayer.x, topLayer.y);
    }
    
    const mergedImageData = ctx.getImageData(0, 0, docSettings.width, docSettings.height);

    // The new merged layer will have the position of the bottom layer
    const mergedLayer: Layer = {
        ...bottomLayer,
        imageData: mergedImageData,
        thumbnail: generateThumbnail(mergedImageData, 48, 40),
    };

    const newLayers = currentLayers.filter(l => l.id !== topLayer.id);
    const finalLayers = newLayers.map(l => l.id === bottomLayer.id ? mergedLayer : l);
    commit(finalLayers, bottomLayer.id);
  };

  const handleSelectionChange = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(null);
    setSelection(rect ? { rect } : null);
  };
  
  const handleSelectionPreview = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(rect ? { rect } : null);
  };

  const handleToolSelect = (tool: EditorTool) => {
    setSelectionPreview(null);
    
    // Set default subtool for the selected tool
    switch (tool) {
        case EditorTool.TRANSFORM:
            setActiveSubTool('move');
            break;
        case EditorTool.PAINT:
            setActiveSubTool('brush');
            break;
        case EditorTool.SELECT:
             setActiveSubTool('rectangle');
            break;
        // Add other defaults as needed
        default:
            // setActiveSubTool(null); // Or keep the last one?
            break;
    }

    if (tool === activeTool) {
        setIsPropertiesPanelOpen(prev => !prev);
    } else { 
        setActiveTool(tool); 
        setIsPropertiesPanelOpen(true); 
    }
  };
  
  const handleImageAdded = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // For loading external stock images
    img.onload = () => {
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            name: 'Image',
            isVisible: true,
            isLocked: false,
            opacity: 1,
            blendMode: 'normal',
            imageData: null, // Will be filled
            x: 0,
            y: 0,
        };

        const canvas = document.createElement('canvas');
        canvas.width = docSettings.width;
        canvas.height = docSettings.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Scale and center the image within the document bounds
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio, 1); // Don't scale up, only down
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);

        newLayer.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        newLayer.thumbnail = generateThumbnail(newLayer.imageData, 48, 40);

        // Insert new layer above the active one
        const activeIndex = activeLayerId ? currentLayers.findIndex(l => l.id === activeLayerId) : currentLayers.length - 1;
        const newLayers = [...currentLayers];
        newLayers.splice(activeIndex + 1, 0, newLayer);
        commit(newLayers, newLayer.id);
    };
    img.onerror = () => {
        alert('Could not load the selected image. It may be due to CORS policy if it\'s a web image.');
    };
    img.src = imageUrl;
  };

  const handleAttemptEditBackground = () => setIsBgConvertModalOpen(true);

  const convertBackgroundToLayer = () => {
    const newLayers = currentLayers.map(l => 
        l.isBackground ? { ...l, name: 'Layer 0', isLocked: false, isBackground: false } : l
    );
    commit(newLayers);
  };

  const handleConfirmConvertToLayer = () => {
    convertBackgroundToLayer();
    setIsBgConvertModalOpen(false);
  };
  
  // --- TRANSFORM TOOL LOGIC ---
  const handleTransformStart = (layerId: string) => {
    const layerToTransform = currentLayers.find(l => l.id === layerId);
    if (layerToTransform) {
        setTransformSession({
            layerId: layerId,
            initialLayerState: layerToTransform,
            transform: new DOMMatrix(),
            isAspectRatioLocked: false,
        });
    }
  };
  const handleTransformUpdate = (newTransform: DOMMatrix) => {
    if (transformSession) {
        setTransformSession(prev => prev ? { ...prev, transform: newTransform } : null);
    }
  };
  const handleTransformCommit = () => {
    if (!transformSession) return;
    const { initialLayerState, transform } = transformSession;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = docSettings.width;
    sourceCanvas.height = docSettings.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx || !initialLayerState.imageData) {
        setTransformSession(null);
        return;
    }
    sourceCtx.putImageData(initialLayerState.imageData, 0, 0);

    const destCanvas = document.createElement('canvas');
    destCanvas.width = docSettings.width;
    destCanvas.height = docSettings.height;
    const destCtx = destCanvas.getContext('2d', { willReadFrequently: true });
    if (!destCtx) {
         setTransformSession(null);
        return;
    }
    
    // The transform matrix is relative to the layer's top-left corner.
    // We need to translate the context so the transform happens around the layer's center.
    const centerX = initialLayerState.x + docSettings.width / 2;
    const centerY = initialLayerState.y + docSettings.height / 2;

    destCtx.translate(centerX, centerY);
    destCtx.setTransform(transform);
    destCtx.translate(-centerX, -centerY);

    destCtx.drawImage(sourceCanvas, initialLayerState.x, initialLayerState.y);

    const newImageData = destCtx.getImageData(0, 0, docSettings.width, docSettings.height);
    
    const newLayers = currentLayers.map(l => 
        l.id === initialLayerState.id ? { ...l, imageData: newImageData, thumbnail: generateThumbnail(newImageData, 48, 40) } : l
    );

    commit(newLayers);
    setTransformSession(null);
  };
  const handleTransformCancel = () => {
    setTransformSession(null);
  };
  // --- END TRANSFORM TOOL LOGIC ---

  // --- MOVE TOOL LOGIC ---
  const handleMoveStart = (layerId: string, mouseX: number, mouseY: number) => {
    const layer = currentLayers.find(l => l.id === layerId);
    if (!layer) return;
    setActiveLayerId(layerId);
    setMoveSession({
        layerId,
        startMouseX: mouseX,
        startMouseY: mouseY,
        layerStartX: layer.x,
        layerStartY: layer.y,
    });
  };

  const handleMoveCommit = (finalMouseX: number, finalMouseY: number) => {
    if (!moveSession) return;
    const deltaX = (finalMouseX - moveSession.startMouseX) / zoom;
    const deltaY = (finalMouseY - moveSession.startMouseY) / zoom;
    const newX = moveSession.layerStartX + deltaX;
    const newY = moveSession.layerStartY + deltaY;

    handleUpdateLayerPosition(moveSession.layerId, newX, newY);
    setMoveSession(null);
  };
  // --- END MOVE TOOL LOGIC ---


  const handleExport = (format: ExportFormat, quality?: number) => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = docSettings.width;
    compositeCanvas.height = docSettings.height;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    currentLayers.forEach(layer => {
      if (layer.isVisible && layer.imageData) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = docSettings.width;
        layerCanvas.height = docSettings.height;
        const layerCtx = layerCanvas.getContext('2d');
        if (layerCtx) {
          layerCtx.putImageData(layer.imageData, 0, 0);
          ctx.globalAlpha = layer.opacity;
          ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
          ctx.drawImage(layerCanvas, layer.x, layer.y);
        }
      }
    });
    
    const dataUrl = compositeCanvas.toDataURL(format, quality);
    const link = document.createElement('a');
    link.href = dataUrl;
    const extension = format.split('/')[1];
    link.download = `${docSettings.name}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProject = () => saveProject(docSettings, currentLayers);
  
  const handleOpenProjectClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const { documentSettings: newDoc, layers: newLayers } = await loadProject(file);
            // Update document settings state and reset history with loaded project
            setDocSettings(newDoc);
            setHistory([newLayers]);
            setHistoryIndex(0);
            setActiveLayerId(newLayers[newLayers.length - 1]?.id ?? null);
            setZoom(1); // Reset zoom for new project
            setSelection(null); // Clear selection from old project
        } catch (error) {
            alert('Error loading project file. It may be invalid.');
            console.error(error);
        } finally {
            e.target.value = ''; // Reset file input
        }
    }
  };
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // --- DERIVED PROPS FOR PANELS ---
  const transformProps = useMemo(() => {
    if (!transformSession) return undefined;
    
    // Decompose matrix to get intuitive values
    const { a, b, c, d, e, f } = transformSession.transform;
    const rotation = Math.atan2(b, a) * (180 / Math.PI);
    const scaleX = Math.sqrt(a * a + b * b);
    const scaleY = Math.sqrt(c * c + d * d) * (a * d - b * c > 0 ? 1 : -1);

    return {
        width: docSettings.width * scaleX,
        height: docSettings.height * scaleY,
        x: e,
        y: f,
        rotation: rotation,
        isAspectRatioLocked: transformSession.isAspectRatioLocked,
        onPropChange: (prop: string, value: number) => console.log(prop, value), // Placeholder
        onLockToggle: () => setTransformSession(prev => prev ? {...prev, isAspectRatioLocked: !prev.isAspectRatioLocked } : null),
    };
  }, [transformSession, docSettings.width, docSettings.height]);
  
  const paintSubTool = activeTool === EditorTool.PAINT ? (activeSubTool as PaintSubTool) : 'brush';

  return (
    <div className="flex flex-col h-screen bg-[#181818] text-gray-300 font-sans text-sm">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".aips" className="hidden" />
      <EditorHeader
        documentName={docSettings.name}
        onClose={onClose} onNew={onNew} onSaveAs={() => setIsExportModalOpen(true)}
        onSaveProject={handleSaveProject} onOpenProject={handleOpenProjectClick}
        canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo}
        zoom={zoom} onZoomChange={setZoom}
      />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
          onSetForegroundColor={setForegroundColor}
          onSetBackgroundColor={setBackgroundColor}
          onSwapColors={() => {
            const temp = foregroundColor;
            setForegroundColor(backgroundColor);
            setBackgroundColor(temp);
          }}
          onResetColors={() => {
            setForegroundColor('#000000');
            setBackgroundColor('#ffffff');
          }}
        />
        {isPropertiesPanelOpen && (
            <PropertiesPanel 
              activeTool={activeTool}
              onClose={() => setIsPropertiesPanelOpen(false)}
              activeSubTool={activeSubTool}
              onSubToolChange={setActiveSubTool}
              transformProps={transformProps}
              onImageAdded={handleImageAdded}
              brushSettings={brushSettings}
              onBrushSettingsChange={setBrushSettings}
            />
        )}
        <main className="flex-1 flex flex-col bg-[#181818] overflow-hidden">
          <CanvasArea
            document={docSettings} layers={currentLayers} activeLayerId={activeLayerId}
            activeTool={activeTool}
            activeSubTool={activeSubTool}
            zoom={zoom} onZoom={handleZoom}
            selection={selection} onSelectionChange={handleSelectionChange}
            selectionPreview={selectionPreview}
            onSelectionPreview={handleSelectionPreview}
            onDrawEnd={handleDrawEnd} onAttemptEditBackgroundLayer={handleAttemptEditBackground}
            onSelectLayer={setActiveLayerId}
            // Move props
            moveSession={moveSession}
            onMoveStart={handleMoveStart}
            onMoveCommit={handleMoveCommit}
            // Transform props
            transformSession={transformSession}
            onTransformStart={handleTransformStart}
            onTransformUpdate={handleTransformUpdate}
            onTransformCommit={