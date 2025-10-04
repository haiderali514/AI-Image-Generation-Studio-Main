import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentSettings, EditorTool, Layer, TransformSubTool, BrushShape, PaintSubTool, AnySubTool, TransformSession, MoveSession, SnapLine, TransformMode, HistoryState } from '../../types';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import ConfirmModal from '../modals/ConfirmModal';
import ExportModal, { ExportFormat } from '../modals/ExportModal';
import { generateThumbnail, fileToBase64, base64ToImageData } from '../../utils/imageUtils';
import { saveProject, loadProject } from '../../utils/projectUtils';
import RightSidebarContainer from './RightSidebarContainer';
import LeftSidebar from './LeftSidebar';
import ContextualTaskbar from './contextualBars/ContextualTaskbar';

interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
  onNew: () => void;
  initialFile?: File | null;
}

const MAX_ZOOM = 5; // 500%
const MIN_ZOOM = 0.01; // 1%

// Helper vector math functions for transformations
const vec = {
    sub: (a: {x:number, y:number}, b: {x:number, y:number}) => ({ x: a.x - b.x, y: a.y - b.y }),
    add: (a: {x:number, y:number}, b: {x:number, y:number}) => ({ x: a.x + b.x, y: a.y + b.y }),
    len: (a: {x:number, y:number}) => Math.hypot(a.x, a.y),
    scale: (a: {x:number, y:number}, s: number) => ({ x: a.x * s, y: a.y * s }),
    dot: (a: {x:number, y:number}, b: {x:number, y:number}) => a.x * b.x + a.y * b.y,
    angle: (a: {x:number, y:number}) => Math.atan2(a.y, a.x),
    rotate: (p: {x:number, y:number}, angleRad: number) => ({
        x: p.x * Math.cos(angleRad) - p.y * Math.sin(angleRad),
        y: p.x * Math.sin(angleRad) + p.y * Math.cos(angleRad),
    }),
};


const Editor: React.FC<EditorProps> = ({ document: initialDocumentSettings, onClose, onNew, initialFile }) => {
  const [docSettings, setDocSettings] = useState(initialDocumentSettings);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.TRANSFORM);
  const [activeSubTool, setActiveSubTool] = useState<AnySubTool>('move');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewResetKey, setViewResetKey] = useState(0);
  const [selection, setSelection] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<{ rect: { x: number; y: number; width: number; height: number; } } | null>(null);
  
  // Left sidebar properties panel visibility
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);

  // Right sidebar panel visibility state
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(true);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
  
  // Right sidebar panel height state
  const [layersPanelHeight, setLayersPanelHeight] = useState(350);
  const [propertiesPanelHeight, setPropertiesPanelHeight] = useState(400);
  const [historyPanelHeight, setHistoryPanelHeight] = useState(250);
  const [commentsPanelHeight, setCommentsPanelHeight] = useState(250);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  
  // State for live previews without creating history (performance optimization)
  const [previewLayerProps, setPreviewLayerProps] = useState<{ id: string; props: Partial<Layer> } | null>(null);

  const [isBgConvertModalOpen, setIsBgConvertModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transformSession, setTransformSession] = useState<TransformSession | null>(null);
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const [transformMode, setTransformMode] = useState<TransformMode>('free-transform');
  
  // Contextual taskbar state
  const [taskbarPosition, setTaskbarPosition] = useState<{ top: number, left: number, visible: boolean }>({ top: 0, left: 0, visible: false });

  // Tool settings state
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [brushSettings, setBrushSettings] = useState({
    size: 30,
    hardness: 0.8,
    opacity: 1,
    shape: 'round' as BrushShape,
  });

  const currentLayers = useMemo(() => history[historyIndex]?.layers ?? [], [history, historyIndex]);

  // Create a memoized version of layers that includes live preview changes
  const layersWithPreview = useMemo(() => {
    if (!previewLayerProps) {
        return currentLayers;
    }
    return currentLayers.map(l => 
        l.id === previewLayerProps.id ? { ...l, ...previewLayerProps.props } : l
    );
  }, [currentLayers, previewLayerProps]);

  const activeLayer = useMemo(() => layersWithPreview.find(l => l.id === activeLayerId), [layersWithPreview, activeLayerId]);

  const commit = useCallback((newLayers: Layer[], action: string, newActiveLayerId?: string) => {
    const newHistoryState: HistoryState = { layers: newLayers, action };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryState);
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
            type: 'pixel',
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
                type: 'pixel',
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

        commit(initialLayers, 'New Document', initialActiveId);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setPan({x:0, y:0}); // Also reset pan
    setViewResetKey(k => k + 1);
  };

  const handleDrawEnd = (strokesImageData: ImageData) => {
    if (!activeLayerId) return;
    
    const activeLayer = currentLayers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.isLocked || activeLayer.isBackground || activeLayer.type !== 'pixel') return;

    const canvas = document.createElement('canvas');
    canvas.width = activeLayer.width;
    canvas.height = activeLayer.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    if (activeLayer.imageData) {
        ctx.putImageData(activeLayer.imageData, 0, 0);
    }
    
    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = docSettings.width;
    strokeCanvas.height = docSettings.height;
    strokeCanvas.getContext('2d')?.putImageData(strokesImageData, 0, 0);
    
    ctx.save();
    ctx.globalCompositeOperation = activeSubTool === 'eraser' ? 'destination-out' : 'source-over';
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
    commit(newLayers, activeSubTool === 'eraser' ? 'Erase' : 'Brush Stroke');
  };

  const handleJumpToHistoryState = (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
    }
  };

  const handleAddLayer = () => {
    let maxLayerNum = 0;
    currentLayers.forEach(l => {
        const match = l.name.match(/^Layer (\d+)$/);
        if (match) {
            maxLayerNum = Math.max(maxLayerNum, parseInt(match[1]));
        }
    });

    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${maxLayerNum + 1}`,
        type: 'pixel',
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
    
    const newLayers = [...currentLayers];
    const activeIndex = activeLayerId ? newLayers.findIndex(l => l.id === activeLayerId) : -1;
    
    if (activeIndex !== -1) {
        newLayers.splice(activeIndex + 1, 0, newLayer);
    } else {
        newLayers.push(newLayer);
    }
    
    commit(newLayers, 'Add Layer', newLayer.id);
  };
  
  const handleAddShapeLayer = (rect: {x: number, y: number, width: number, height: number}) => {
    let maxLayerNum = 0;
    currentLayers.forEach(l => {
        const match = l.name.match(/^Rectangle (\d+)$/);
        if (match) {
            maxLayerNum = Math.max(maxLayerNum, parseInt(match[1]));
        }
    });

    const newShapeLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Rectangle ${maxLayerNum + 1}`,
        type: 'shape',
        shapeProps: {
            type: 'rectangle',
            fill: foregroundColor,
            stroke: null,
            strokeWidth: 0,
        },
        isVisible: true,
        isLocked: false,
        opacity: 1,
        blendMode: 'normal',
        imageData: null,
        thumbnail: '', // Will be rendered by LayersPanel
        width: rect.width,
        height: rect.height,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
    };
    
    const newLayers = [...currentLayers];
    const activeIndex = activeLayerId ? newLayers.findIndex(l => l.id === activeLayerId) : -1;
    
    // Add new layer above active layer, or at the top
    const insertionIndex = activeIndex !== -1 ? newLayers.findIndex(l => l.id === activeLayerId) + 1 : newLayers.length;
    newLayers.splice(insertionIndex, 0, newShapeLayer);
    
    commit(newLayers, 'Add Shape', newShapeLayer.id);
  };

  const handleDeleteLayer = () => {
    if (currentLayers.length <= 1 || activeLayer?.isBackground) return;
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    const newLayers = currentLayers.filter(l => l.id !== activeLayerId);
    let newActiveId = null;
    if (newLayers.length > 0) {
        newActiveId = newLayers[Math.max(0, Math.min(newLayers.length - 1, activeIndex -1))]?.id;
    }
    commit(newLayers, 'Delete Layer', newActiveId ?? undefined);
  };
  
  const handleUpdateLayerProps = useCallback((id: string, props: Partial<Omit<Layer, 'imageData'>>, action: string) => {
    const finalLayers = currentLayers.map(l => (l.id === id ? { ...l, ...props } : l));
    setPreviewLayerProps(null);
    commit(finalLayers, action);
  }, [commit, currentLayers]);

  const handleUpdateLayerPropsPreview = (id: string, props: Partial<Layer>) => {
    setPreviewLayerProps({ id, props });
  };
  
  const handleUpdateLayerTransform = useCallback((id: string, props: Partial<Pick<Layer, 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY'>>) => {
     setPreviewLayerProps(prev => ({ id, props: { ...(prev?.props ?? {}), ...props } }));
  }, []);

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
    commit(newLayers, 'Duplicate Layer', newLayer.id);
  };

  const handleMergeDown = () => {
    const activeIndex = currentLayers.findIndex(l => l.id === activeLayerId);
    if (activeIndex <= 0 || currentLayers[activeIndex].isBackground) return;
    
    const topLayer = currentLayers[activeIndex];
    const bottomLayer = currentLayers[activeIndex - 1];
    
    if (bottomLayer.isBackground || bottomLayer.type !== 'pixel' || topLayer.type !== 'pixel') {
        alert("Cannot merge: merging is only supported for pixel layers and not onto the Background.");
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
    commit(newLayers, 'Merge Layers', mergedLayer.id);
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
            type: 'pixel',
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
        commit(newLayers, 'Add Image', newLayer.id);
    };
    img.onerror = () => alert('Could not load the selected image.');
    img.src = imageUrl;
  };

  const handleAttemptEditBackground = () => setIsBgConvertModalOpen(true);

  const convertBackgroundToLayer = () => {
    const newLayers = currentLayers.map(l => 
        l.isBackground ? { ...l, name: 'Layer 0', isLocked: false, isBackground: false } : l
    );
    commit(newLayers, 'Convert Background to Layer');
  };

  const handleConfirmConvertToLayer = () => {
    convertBackgroundToLayer();
    setIsBgConvertModalOpen(false);
  };
  
  // --- TRANSFORM TOOL LOGIC ---
  const handleTransformStart = (layer: Layer, handle: string, e: React.MouseEvent, canvasMousePos: {x: number, y: number}, cursor: string) => {
    setActiveLayerId(layer.id);
    setPreviewLayerProps(null); // Clear previous preview
    
    let previousSubTool: AnySubTool | null = null;
    if (activeTool === EditorTool.TRANSFORM && activeSubTool === 'move') {
        previousSubTool = 'move';
        setActiveSubTool('transform');
    }

    setTransformSession({
        layer: layer,
        handle: handle,
        isAspectRatioLocked: e.shiftKey,
        originalLayer: layer,
        startMouse: { x: e.clientX, y: e.clientY },
        startCanvasMouse: canvasMousePos,
        startPan: pan,
        startZoom: zoom,
        mode: transformMode,
        previousSubTool: previousSubTool,
        startCursor: cursor,
    });
  };

  const handleTransformCommit = useCallback(() => {
    if (!transformSession || !previewLayerProps) {
      setTransformSession(null);
      setPreviewLayerProps(null);
      return;
    }
    const { originalLayer, previousSubTool } = transformSession;
    
    document.body.style.cursor = '';
    
    const finalProps = previewLayerProps.props;
    const hasChanged = Object.keys(finalProps).some(key => {
        const propKey = key as keyof Layer;
        return finalProps[propKey] !== originalLayer[propKey];
    });

    if (hasChanged) {
        commit(currentLayers.map(l => l.id === originalLayer.id ? { ...l, ...finalProps } : l), 'Transform Layer', originalLayer.id);
    }
    
    if (previousSubTool) {
        setActiveSubTool(previousSubTool);
    }
    setTransformSession(null);
    setPreviewLayerProps(null);
  }, [transformSession, previewLayerProps, currentLayers, commit]);

  const handleTransformCancel = useCallback(() => {
    if (!transformSession) return;
    const { previousSubTool } = transformSession;
    document.body.style.cursor = '';

    if (previousSubTool) {
        setActiveSubTool(previousSubTool);
    }
    setTransformSession(null);
    setPreviewLayerProps(null);
  }, [transformSession]);

  const handleMoveStart = (layerId: string, mouseX: number, mouseY: number) => {
    const layer = currentLayers.find(l => l.id === layerId);
    if (!layer || layer.isLocked) return;
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
  
  const handleMoveCommit = (finalMouseX: number, finalMouseY: number) => {
    if (!moveSession) return;
    const { layerId, startMouseX, startMouseY, layerStartX, layerStartY } = moveSession;
    const deltaX = (finalMouseX - startMouseX) / zoom;
    const deltaY = (finalMouseY - startMouseY) / zoom;
    const newX = layerStartX + deltaX;
    const newY = layerStartY + deltaY;
    
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        handleUpdateLayerProps(layerId, { x: newX, y: newY }, 'Move Layer');
    }
    setMoveSession(null);
    setSnapLines([]);
  };

  const handleMoveUpdate = useCallback((mouseX: number, mouseY: number) => {
    if (!moveSession) return;

    const deltaX = (mouseX - moveSession.startMouseX) / zoom;
    const deltaY = (mouseY - moveSession.startMouseY) / zoom;
    let newX = moveSession.layerStartX + deltaX;
    let newY = moveSession.layerStartY + deltaY;

    const movingLayer = currentLayers.find(l => l.id === moveSession.layerId);
    if (!movingLayer) return;

    const SNAP_THRESHOLD = 6 / zoom;
    const newSnapLines: SnapLine[] = [];

    const getBounds = (layer: Layer) => ({
      left: layer.x - (layer.width * layer.scaleX) / 2,
      right: layer.x + (layer.width * layer.scaleX) / 2,
      top: layer.y - (layer.height * layer.scaleY) / 2,
      bottom: layer.y + (layer.height * layer.scaleY) / 2,
      centerX: layer.x,
      centerY: layer.y,
    });
    
    const movingBounds = getBounds({ ...movingLayer, x: newX, y: newY });
    const targetLayers = currentLayers.filter(l => l.id !== moveSession.layerId && l.isVisible && !l.isBackground);

    // Add canvas to targets
    const canvasTarget = {
        left: 0, right: docSettings.width, top: 0, bottom: docSettings.height,
        centerX: docSettings.width / 2, centerY: docSettings.height / 2,
    }

    const checkAndSnap = (
        movingVal: number, targetVal: number, 
        setter: (val: number) => void,
        lineType: 'horizontal' | 'vertical', linePos: number,
        // FIX: Update types to include left/right properties, which are used below.
        movingBounds: { top: number; bottom: number; left: number; right: number }, 
        targetBounds: { top: number; bottom: number; left: number; right: number }
    ) => {
        if (Math.abs(movingVal - targetVal) < SNAP_THRESHOLD) {
            setter(targetVal);
            const start = Math.min(movingBounds.top, targetBounds.top);
            const end = Math.max(movingBounds.bottom, targetBounds.bottom);
            newSnapLines.push({ type: lineType, position: linePos, start: lineType === 'horizontal' ? Math.min(movingBounds.left, targetBounds.left) : start, end: lineType === 'horizontal' ? Math.max(movingBounds.right, targetBounds.right) : end });
            return true;
        }
        return false;
    };
    
    [...targetLayers.map(getBounds), canvasTarget].forEach(targetBounds => {
        // Vertical snapping
        checkAndSnap(movingBounds.left, targetBounds.left, (val) => newX += val - movingBounds.left, 'vertical', targetBounds.left, movingBounds, targetBounds);
        checkAndSnap(movingBounds.centerX, targetBounds.centerX, (val) => newX += val - movingBounds.centerX, 'vertical', targetBounds.centerX, movingBounds, targetBounds);
        checkAndSnap(movingBounds.right, targetBounds.right, (val) => newX += val - movingBounds.right, 'vertical', targetBounds.right, movingBounds, targetBounds);
        
        // Horizontal snapping
        checkAndSnap(movingBounds.top, targetBounds.top, (val) => newY += val - movingBounds.top, 'horizontal', targetBounds.top, movingBounds, targetBounds);
        checkAndSnap(movingBounds.centerY, targetBounds.centerY, (val) => newY += val - movingBounds.centerY, 'horizontal', targetBounds.centerY, movingBounds, targetBounds);
        checkAndSnap(movingBounds.bottom, targetBounds.bottom, (val) => newY += val - movingBounds.bottom, 'horizontal', targetBounds.bottom, movingBounds, targetBounds);
    });

    setSnapLines(newSnapLines);
    handleUpdateLayerPropsPreview(moveSession.layerId, { x: newX, y: newY });
    setMoveSession(prev => prev ? { ...prev, currentMouseX: mouseX, currentMouseY: mouseY } : null);
  }, [moveSession, zoom, currentLayers, handleUpdateLayerPropsPreview, docSettings.width, docSettings.height]);
  
  // Undo/Redo
  const handleUndo = useCallback(() => {
    handleJumpToHistoryState(historyIndex - 1);
  }, [historyIndex]);
  const handleRedo = useCallback(() => {
    handleJumpToHistoryState(historyIndex + 1);
  }, [historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (transformSession) {
        if (e.key === 'Enter') handleTransformCommit();
        if (e.key === 'Escape') handleTransformCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, transformSession, handleTransformCommit, handleTransformCancel]);
  
  const handleExport = (format: ExportFormat, quality?: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = docSettings.width;
    canvas.height = docSettings.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Render layers from bottom to top
    currentLayers.forEach(layer => {
      if (!layer.isVisible) return;
      if (!layer.imageData && layer.type !== 'shape') return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
      
      ctx.translate(layer.x, layer.y);
      ctx.rotate(layer.rotation * Math.PI / 180);
      ctx.scale(layer.scaleX, layer.scaleY);
      ctx.translate(-layer.width / 2, -layer.height / 2);

      if (layer.type === 'pixel' && layer.imageData) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = layer.width;
        offscreenCanvas.height = layer.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (offscreenCtx) {
          offscreenCtx.putImageData(layer.imageData, 0, 0);
          ctx.drawImage(offscreenCanvas, 0, 0);
        }
      } else if (layer.type === 'shape' && layer.shapeProps) {
        const { type, fill, stroke, strokeWidth } = layer.shapeProps;
        if (type === 'rectangle') {
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, layer.width, layer.height);
          }
          if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(0, 0, layer.width, layer.height);
          }
        }
      }
      ctx.restore();
    });

    const dataUrl = canvas.toDataURL(format, quality);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${docSettings.name}.${format.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSaveProject = () => {
      saveProject(docSettings, currentLayers);
  };

  const handleOpenProject = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { documentSettings, layers } = await loadProject(file);
        setDocSettings(documentSettings);
        setHistoryIndex(0);
        setHistory([{ layers: layers, action: 'Open Project' }]);
        setActiveLayerId(layers[layers.length - 1].id);
        setZoom(1);
        setPan({x: 0, y: 0});
        setViewResetKey(k => k + 1);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'An unknown error occurred.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleRotate = (degrees: number) => {
    if (!activeLayer) return;
    const newRotation = (activeLayer.rotation + degrees) % 360;
    setPreviewLayerProps({ id: activeLayer.id, props: { rotation: newRotation }});
  }

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (!activeLayer) return;
    if (direction === 'horizontal') {
        setPreviewLayerProps({ id: activeLayer.id, props: { scaleX: -activeLayer.scaleX }});
    } else {
        setPreviewLayerProps({ id: activeLayer.id, props: { scaleY: -activeLayer.scaleY }});
    }
  }

  // Update contextual taskbar position
  useEffect(() => {
    if (activeLayer && containerRef.current) {
        const layerBounds = {
            left: (activeLayer.x - (activeLayer.width * activeLayer.scaleX) / 2) * zoom + pan.x,
            bottom: (activeLayer.y + (activeLayer.height * activeLayer.scaleY) / 2) * zoom + pan.y,
        };
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setTaskbarPosition({
            top: layerBounds.bottom + containerRect.top + 20,
            left: layerBounds.left + (activeLayer.width * activeLayer.scaleX * zoom) / 2 + containerRect.left,
            visible: true
        });
    } else {
        setTaskbarPosition(p => ({ ...p, visible: false }));
    }
  }, [activeLayer, pan, zoom, docSettings.width, docSettings.height]);

  const containerRef = useRef<HTMLDivElement>(null);
  
  const transformPropsForPanel = useMemo(() => activeLayer ? ({
    layer: activeLayer,
    onPropChange: (prop: keyof Layer, value: number) => handleUpdateLayerTransform(activeLayer.id, { [prop]: value }),
    onCommit: (prop: keyof Layer, value: number) => handleUpdateLayerProps(activeLayer.id, { [prop]: value }, 'Transform Layer'),
  }) : undefined, [activeLayer, handleUpdateLayerTransform, handleUpdateLayerProps]);

  return (
    <div className="w-screen h-screen bg-[#181818] flex flex-col font-sans overflow-hidden">
        <input ref={fileInputRef} type="file" accept=".aips" onChange={handleFileChange} className="hidden" />
        <EditorHeader 
            documentName={docSettings.name} 
            onClose={onClose}
            onNew={onNew}
            onSaveAs={() => setIsExportModalOpen(true)}
            onSaveProject={handleSaveProject}
            onOpenProject={handleOpenProject}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomChange={handleZoom}
            onResetView={handleResetView}
        />
        <main ref={containerRef} className="flex-1 flex overflow-hidden">
            <LeftSidebar 
              activeTool={activeTool}
              onToolSelect={(tool) => {
                setActiveTool(tool);
                // Reset to default sub-tool when changing main tool
                if (tool === EditorTool.TRANSFORM) setActiveSubTool('move');
                else if (tool === EditorTool.PAINT) setActiveSubTool('brush');
              }}
              foregroundColor={foregroundColor}
              backgroundColor={backgroundColor}
              onSetForegroundColor={setForegroundColor}
              onSetBackgroundColor={setBackgroundColor}
              onSwapColors={() => { const temp = foregroundColor; setForegroundColor(backgroundColor); setBackgroundColor(temp); }}
              onResetColors={() => { setForegroundColor('#000000'); setBackgroundColor('#ffffff'); }}
              isPropertiesPanelOpen={isPropertiesPanelOpen}
              togglePropertiesPanel={() => setIsPropertiesPanelOpen(p => !p)}
              activeSubTool={activeSubTool}
              onSubToolChange={setActiveSubTool}
              transformProps={transformPropsForPanel}
              onImageAdded={handleImageAdded}
              brushSettings={brushSettings}
              onBrushSettingsChange={setBrushSettings}
            />
            <CanvasArea
                document={docSettings}
                layers={layersWithPreview}
                activeLayerId={activeLayerId}
                activeTool={activeTool}
                activeSubTool={activeSubTool}
                zoom={zoom}
                onZoom={handleZoom}
                pan={pan}
                onPanChange={setPan}
                viewResetKey={viewResetKey}
                selection={selection}
                onSelectionChange={handleSelectionChange}
                selectionPreview={selectionPreview}
                onSelectionPreview={handleSelectionPreview}
                onDrawEnd={handleDrawEnd}
                onAttemptEditBackgroundLayer={handleAttemptEditBackground}
                onSelectLayer={setActiveLayerId}
                moveSession={moveSession}
                onMoveStart={handleMoveStart}
                onMoveUpdate={handleMoveUpdate}
                onMoveCommit={handleMoveCommit}
                transformSession={transformSession}
                onTransformStart={handleTransformStart}
                onTransformUpdate={() => {}} // Placeholder
                onTransformCommit={handleTransformCommit}
                onTransformCancel={handleTransformCancel}
                snapLines={snapLines}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                brushSize={brushSettings.size}
                brushOpacity={brushSettings.opacity}
                brushHardness={brushSettings.hardness}
                brushShape={brushSettings.shape}
                fontFamily={'sans-serif'}
                fontSize={48}
                textAlign={'left'}
                onAddShapeLayer={handleAddShapeLayer}
            />
            <RightSidebarContainer
              layers={currentLayers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onAddLayer={handleAddLayer}
              onDeleteLayer={handleDeleteLayer}
              onUpdateLayerProps={handleUpdateLayerProps}
              onUpdateLayerPropsPreview={handleUpdateLayerPropsPreview}
              onDuplicateLayer={handleDuplicateLayer}
              onMergeDown={handleMergeDown}
              onConvertBackground={() => setIsBgConvertModalOpen(true)}
              isLayersPanelOpen={isLayersPanelOpen}
              toggleLayersPanel={() => setIsLayersPanelOpen(p => !p)}
              layersPanelHeight={layersPanelHeight}
              onLayersPanelHeightChange={setLayersPanelHeight}
              isHistoryPanelOpen={isHistoryPanelOpen}
              toggleHistoryPanel={() => setIsHistoryPanelOpen(p => !p)}
              historyPanelHeight={historyPanelHeight}
              onHistoryPanelHeightChange={setHistoryPanelHeight}
              history={history}
              historyIndex={historyIndex}
              onJumpToHistoryState={handleJumpToHistoryState}
              isCommentsPanelOpen={isCommentsPanelOpen}
              toggleCommentsPanel={() => setIsCommentsPanelOpen(p => !p)}
              commentsPanelHeight={commentsPanelHeight}
              onCommentsPanelHeightChange={setCommentsPanelHeight}
            />
             <ContextualTaskbar 
                position={taskbarPosition}
                activeTool={activeTool}
                activeSubTool={activeSubTool}
                transformSession={transformSession}
                onTransformConfirm={handleTransformCommit}
                onTransformCancel={handleTransformCancel}
                onRotateCW={() => handleRotate(90)}
                onRotateCCW={() => handleRotate(-90)}
                onFlipHorizontal={() => handleFlip('horizontal')}
                onFlipVertical={() => handleFlip('vertical')}
            />
        </main>
        <ConfirmModal
            isOpen={isBgConvertModalOpen}
            onClose={() => setIsBgConvertModalOpen(false)}
            onConfirm={handleConfirmConvertToLayer}
            title="Convert Background"
            confirmText="Convert"
        >
          <p>The Background layer cannot be moved or have its blending options changed. Do you want to convert it to a normal layer?</p>
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
