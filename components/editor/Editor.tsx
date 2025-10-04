
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentSettings, EditorTool, Layer, TransformSubTool, BrushShape, PaintSubTool, AnySubTool, TransformSession } from '../../types';
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

interface MoveSession {
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    layerStartX: number;
    layerStartY: number;
    currentMouseX: number;
    currentMouseY: number;
}

const MAX_ZOOM = 5; // 500%
const MIN_ZOOM = 0.01; // 1%

const Editor: React.FC<EditorProps> = ({ document: initialDocumentSettings, onClose, onNew, initialFile }) => {
  const [docSettings, setDocSettings] = useState(initialDocumentSettings);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.TRANSFORM);
  const [activeSubTool, setActiveSubTool] = useState<AnySubTool>('move');
  const [zoom, setZoom] = useState(1);
  const [viewResetKey, setViewResetKey] = useState(0);
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
            x: initialDocumentSettings.width / 2,
            y: initialDocumentSettings.height / 2,
            width: initialDocumentSettings.width,
            height: initialDocumentSettings.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
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
                x: initialDocumentSettings.width / 2,
                y: initialDocumentSettings.height / 2,
                width: initialDocumentSettings.width,
                height: initialDocumentSettings.height,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
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

  const handleResetView = () => {
    setZoom(1);
    setViewResetKey(k => k + 1);
  };

  const handleDrawEnd = (strokesImageData: ImageData) => {
    if (!activeLayerId) return;
    
    const activeLayer = currentLayers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.isLocked || activeLayer.isBackground) return;

    const canvas = document.createElement('canvas');
    canvas.width = activeLayer.width;
    canvas.height = activeLayer.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // 1. Draw the original layer content (untransformed)
    if (activeLayer.imageData) {
        ctx.putImageData(activeLayer.imageData, 0, 0);
    }
    
    // 2. Draw the new stroke on top
    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = docSettings.width;
    strokeCanvas.height = docSettings.height;
    strokeCanvas.getContext('2d')?.putImageData(strokesImageData, 0, 0);
    
    // We need to draw the stroke in the layer's local coordinate space
    ctx.save();
    ctx.globalCompositeOperation = activeSubTool === 'eraser' ? 'destination-out' : 'source-over';
    // Apply inverse transform to the stroke canvas before drawing it onto the layer's canvas
    const tx = activeLayer.x - activeLayer.width / 2;
    const ty = activeLayer.y - activeLayer.height / 2;
    ctx.translate(-tx, -ty);
    ctx.drawImage(strokeCanvas, 0, 0);
    ctx.restore();

    const newImageData = ctx.getImageData(0, 0, activeLayer.width, activeLayer.height);

    const newLayers = currentLayers.map(layer => {
        if (layer.id === activeLayerId) {
            return { ...layer, imageData: newImageData, thumbnail: generateThumbnail(newImageData, 48, 40) };
        }
        return layer;
    });
    commit(newLayers);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  }, [historyIndex, history.length]);
  
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${currentLayers.length}`,
        isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal',
        imageData: null, thumbnail: generateThumbnail(null, 48, 40),
        x: docSettings.width / 2,
        y: docSettings.height / 2,
        width: docSettings.width,
        height: docSettings.height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
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
  
  const handleUpdateLayerProps = (id: string, props: Partial<Omit<Layer, 'imageData'>>) => {
    const newLayers = currentLayers.map(l => l.id === id ? { ...l, ...props } : l);
    // This function is for property changes that should generate a history state
    commit(newLayers);
  };
  
  const handleUpdateLayerTransform = (id: string, props: Partial<Pick<Layer, 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY'>>) => {
    const newLayers = currentLayers.map(l => l.id === id ? { ...l, ...props } : l);
    // This is for live updates, so it doesn't create a history state
    const newHistory = [...history];
    newHistory[historyIndex] = newLayers;
    setHistory(newHistory);
  };

  const handleDuplicateLayer = () => {
    if (!activeLayer) return;
    const newLayer: Layer = {
        ...activeLayer,
        id: crypto.randomUUID(),
        name: `${activeLayer.name} copy`,
        x: activeLayer.x + 10,
        y: activeLayer.y + 10,
    };
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    const newLayers = [...currentLayers];
    newLayers.splice(activeIndex + 1, 0, newLayer);
    commit(newLayers, newLayer.id);
  };

  const handleMergeDown = () => {
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    if (activeIndex <= 0 || currentLayers[activeIndex].isBackground) return; // Cannot merge down if it's the bottom layer or background
    
    const topLayer = currentLayers[activeIndex];
    const bottomLayer = currentLayers[activeIndex - 1];
    
    if (bottomLayer.isBackground) {
        alert("Cannot merge down onto the Background layer.");
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = docSettings.width;
    canvas.height = docSettings.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const renderLayer = (layer: Layer) => {
        if (!layer.imageData) return;
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = layer.width;
        layerCanvas.height = layer.height;
        layerCanvas.getContext('2d')?.putImageData(layer.imageData, 0, 0);

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
        ctx.translate(layer.x, layer.y);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scaleX, layer.scaleY);
        ctx.drawImage(layerCanvas, -layer.width / 2, -layer.height / 2);
        ctx.restore();
    };

    renderLayer(bottomLayer);
    renderLayer(topLayer);
    
    const mergedImageData = ctx.getImageData(0, 0, docSettings.width, docSettings.height);

    const mergedLayer: Layer = {
        ...bottomLayer,
        name: `Merged ${topLayer.name}, ${bottomLayer.name}`,
        imageData: mergedImageData,
        thumbnail: generateThumbnail(mergedImageData, 48, 40),
        width: docSettings.width,
        height: docSettings.height,
        x: docSettings.width / 2,
        y: docSettings.height / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    };

    const newLayers = currentLayers.filter(l => l.id !== topLayer.id && l.id !== bottomLayer.id);
    newLayers.splice(activeIndex - 1, 0, mergedLayer);
    commit(newLayers, mergedLayer.id);
  };

  const handleSelectionChange = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(null);
    setSelection(rect ? { rect } : null);
  };
  
  const handleSelectionPreview = (rect: {x:number, y:number, width:number, height:number} | null) => {
    setSelectionPreview(rect ? { rect } : null);
  };
  
  const handleImageAdded = async (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            name: 'Image',
            isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal',
            imageData: imageData,
            thumbnail: generateThumbnail(imageData, 48, 40),
            width: img.width,
            height: img.height,
            x: docSettings.width / 2,
            y: docSettings.height / 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
        };

        const activeIndex = activeLayerId ? currentLayers.findIndex(l => l.id === activeLayerId) : currentLayers.length - 1;
        const newLayers = [...currentLayers];
        newLayers.splice(activeIndex + 1, 0, newLayer);
        commit(newLayers, newLayer.id);
    };
    img.onerror = () => alert('Could not load the selected image.');
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
  const handleTransformStart = (layer: Layer, handle: string, e: React.MouseEvent) => {
    setActiveLayerId(layer.id);
    setTransformSession({
        layer: layer,
        handle: handle,
        isAspectRatioLocked: e.shiftKey,
        originalLayer: layer,
        startMouse: { x: e.clientX, y: e.clientY },
    });
  };

  const handleTransformUpdate = (newLayer: Layer) => {
    if (transformSession) {
      setTransformSession(prev => prev ? { ...prev, layer: newLayer } : null);
    }
  };

  const handleTransformCommit = useCallback(() => {
    if (!transformSession) return;
    const { layer } = transformSession;
    const newLayers = currentLayers.map(l => l.id === layer.id ? layer : l);
    commit(newLayers, layer.id);
    setTransformSession(null);
  }, [transformSession, currentLayers, commit]);

  const handleTransformCancel = useCallback(() => {
    if (transformSession) {
        setTransformSession(null); // Just discard changes
    }
  }, [transformSession]);
  
  // FIX: This useEffect was moved after its dependencies were declared to fix "used before declaration" errors.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && activeTool === EditorTool.TRANSFORM && activeSubTool === 'transform') {
        e.preventDefault();
        handleTransformCommit();
      }
      if (e.key === 'Escape' && activeTool === EditorTool.TRANSFORM && activeSubTool === 'transform') {
        e.preventDefault();
        handleTransformCancel();
      }

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
  }, [selection, activeTool, activeSubTool, handleTransformCommit, handleTransformCancel, handleUndo, handleRedo]);

  // --- END TRANSFORM TOOL LOGIC ---

  // --- MOVE TOOL LOGIC ---
  const handleMoveStart = (layerId: string, mouseX: number, mouseY: number) => {
    const layer = currentLayers.find(l => l.id === layerId);
    if (!layer || layer.isLocked || layer.isBackground) return;
    setActiveLayerId(layerId);
    setMoveSession({
        layerId,
        startMouseX: mouseX,
        startMouseY: mouseY,
        layerStartX: layer.x,
        layerStartY: layer.y,
        currentMouseX: mouseX,
        currentMouseY: mouseY,
    });
  };

  const handleMoveUpdate = (mouseX: number, mouseY: number) => {
      if (moveSession) {
          setMoveSession(prev => prev ? { ...prev, currentMouseX: mouseX, currentMouseY: mouseY } : null);
      }
  };

  const handleMoveCommit = (finalMouseX: number, finalMouseY: number) => {
    if (!moveSession) return;
    const deltaX = (finalMouseX - moveSession.startMouseX) / zoom;
    const deltaY = (finalMouseY - moveSession.startMouseY) / zoom;
    const newX = moveSession.layerStartX + deltaX;
    const newY = moveSession.layerStartY + deltaY;

    if (Math.round(newX) !== moveSession.layerStartX || Math.round(newY) !== moveSession.layerStartY) {
        handleUpdateLayerProps(moveSession.layerId, { x: newX, y: newY });
    }
    setMoveSession(null);
  };
  // --- END MOVE TOOL LOGIC ---

  const handleToolSelect = (tool: EditorTool) => {
    handleTransformCommit(); // Commit any pending transform when switching tools
    setSelectionPreview(null);
    
    switch (tool) {
        case EditorTool.TRANSFORM: setActiveSubTool('move'); break;
        case EditorTool.PAINT: setActiveSubTool('brush'); break;
        case EditorTool.SELECT: setActiveSubTool('rectangle'); break;
        default: break;
    }

    if (tool === activeTool) {
        setIsPropertiesPanelOpen(prev => !prev);
    } else { 
        setActiveTool(tool); 
        setIsPropertiesPanelOpen(true); 
    }
  };

  const handleExport = (format: ExportFormat, quality?: number) => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = docSettings.width;
    compositeCanvas.height = docSettings.height;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    // Render layers in order from bottom to top
    [...currentLayers].reverse().forEach(layer => {
      if (layer.isVisible && layer.imageData) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = layer.width;
        layerCanvas.height = layer.height;
        layerCanvas.getContext('2d')?.putImageData(layer.imageData, 0, 0);
        
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.isBackground ? 'source-over' : (layer.blendMode === 'normal' ? 'source-over' : layer.blendMode);
        
        ctx.translate(layer.x, layer.y);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.scale(layer.scaleX, layer.scaleY);

        ctx.drawImage(layerCanvas, -layer.width / 2, -layer.height / 2);
        ctx.restore();
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
            setDocSettings(newDoc);
            setHistory([newLayers]);
            setHistoryIndex(0);
            setActiveLayerId(newLayers[newLayers.length - 1]?.id ?? null);
            setZoom(1);
            setSelection(null);
        } catch (error) {
            alert('Error loading project file. It may be invalid.');
            console.error(error);
        } finally {
            e.target.value = '';
        }
    }
  };
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const transformPropsForPanel = useMemo(() => {
    const layer = transformSession?.layer ?? activeLayer;
    if (!layer || layer.isBackground) return undefined;
    
    return {
        layer,
        onPropChange: (prop: keyof Layer, value: number) => {
            handleUpdateLayerTransform(layer.id, { [prop]: value });
        },
        onCommit: (prop: keyof Layer, value: number) => {
             handleUpdateLayerProps(layer.id, { [prop]: value });
        },
    };
  }, [transformSession, activeLayer, handleUpdateLayerTransform, handleUpdateLayerProps]);
  
  return (
    <div className="flex flex-col h-screen bg-[#181818] text-gray-300 font-sans text-sm">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".aips" className="hidden" />
      <EditorHeader
        documentName={docSettings.name}
        onClose={onClose} onNew={onNew} onSaveAs={() => setIsExportModalOpen(true)}
        onSaveProject={handleSaveProject} onOpenProject={handleOpenProjectClick}
        canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo}
        zoom={zoom} onZoomChange={setZoom} onResetView={handleResetView}
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
              transformProps={transformPropsForPanel}
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
            viewResetKey={viewResetKey}
            selection={selection} onSelectionChange={handleSelectionChange}
            selectionPreview={selectionPreview}
            onSelectionPreview={handleSelectionPreview}
            onDrawEnd={handleDrawEnd} onAttemptEditBackgroundLayer={handleAttemptEditBackground}
            onSelectLayer={setActiveLayerId}
            moveSession={moveSession}
            onMoveStart={handleMoveStart}
            onMoveUpdate={handleMoveUpdate}
            onMoveCommit={handleMoveCommit}
            transformSession={transformSession}
            onTransformStart={handleTransformStart}
            onTransformUpdate={handleTransformUpdate}
            onTransformCommit={handleTransformCommit}
            onTransformCancel={handleTransformCancel}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            brushSize={brushSettings.size}
            brushOpacity={brushSettings.opacity}
            brushHardness={brushSettings.hardness}
            brushShape={brushSettings.shape}
            fontFamily="sans-serif"
            fontSize={48}
            textAlign="left"
          />
        </main>
        <LayersPanel
            layers={currentLayers}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onUpdateLayerProps={handleUpdateLayerProps}
            onDuplicateLayer={handleDuplicateLayer}
            onMergeDown={handleMergeDown}
            onConvertBackground={handleAttemptEditBackground}
        />
      </div>
      <ConfirmModal 
        isOpen={isBgConvertModalOpen}
        onClose={() => setIsBgConvertModalOpen(false)}
        onConfirm={handleConfirmConvertToLayer}
        title="Convert to Layer"
        confirmText="Convert"
      >
        <p>The Background layer is special. You can't move it, hide it, change its stacking order or blending mode. To get full access, you must convert it to a normal layer.</p>
      </ConfirmModal>
       <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        documentName={docSettings.name}
      />
    </div>
  );
};

export default Editor;
