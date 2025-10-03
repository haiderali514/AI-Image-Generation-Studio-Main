
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentSettings, EditorTool, Layer, AutoSelectType } from '../../types';
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

const MAX_ZOOM = 32; // 3200%
const MIN_ZOOM = 0.05; // 5%

const Editor: React.FC<EditorProps> = ({ document: documentSettings, onClose, onNew, initialFile }) => {
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.MOVE);
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
        if (documentSettings.background !== 'Transparent') {
            const canvas = document.createElement('canvas');
            canvas.width = documentSettings.width;
            canvas.height = documentSettings.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
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
            imageData: initialImageData,
            thumbnail: generateThumbnail(initialImageData, 48, 40),
        };
        
        let initialLayers = [backgroundLayer];
        let initialActiveId = backgroundLayer.id;

        if (initialFile) {
            const base64 = await fileToBase64(initialFile);
            const imageData = await base64ToImageData(base64, documentSettings.width, documentSettings.height);
            const imageLayer: Layer = {
                id: crypto.randomUUID(),
                name: initialFile.name.split('.').slice(0, -1).join('.') || 'Layer 1',
                isVisible: true,
                isLocked: false,
                imageData: imageData,
                opacity: 1,
                blendMode: 'normal',
                thumbnail: generateThumbnail(imageData, 48, 40),
            };
            initialLayers.push(imageLayer);
            initialActiveId = imageLayer.id;
        }

        setHistory([initialLayers]);
        setHistoryIndex(0);
        setActiveLayerId(initialActiveId);
    };
    init();
  }, [documentSettings, initialFile]);

  
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

  const handleDrawEnd = (imageData: ImageData) => {
    if (!activeLayerId) return;
    const newLayers = currentLayers.map(layer => {
        if (layer.id === activeLayerId) {
            return { ...layer, imageData, thumbnail: generateThumbnail(imageData, 48, 40) };
        }
        return layer;
    });
    commit(newLayers);
  };

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
  };
  
  const handleAddLayer = () => {
    const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${currentLayers.length}`,
        isVisible: true, isLocked: false, opacity: 1, blendMode: 'normal',
        imageData: null, thumbnail: generateThumbnail(null, 48, 40),
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
    canvas.width = documentSettings.width;
    canvas.height = documentSettings.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (bottomLayer.imageData) ctx.putImageData(bottomLayer.imageData, 0, 0);
    if (topLayer.imageData) {
        ctx.globalAlpha = topLayer.opacity;
        ctx.globalCompositeOperation = topLayer.blendMode === 'normal' ? 'source-over' : topLayer.blendMode;
        
        const topCanvas = document.createElement('canvas');
        topCanvas.width = documentSettings.width;
        topCanvas.height = documentSettings.height;
        topCanvas.getContext('2d')?.putImageData(topLayer.imageData, 0, 0);
        ctx.drawImage(topCanvas, 0, 0);
    }
    const mergedImageData = ctx.getImageData(0, 0, documentSettings.width, documentSettings.height);
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
    if (tool === activeTool) setIsPropertiesPanelOpen(prev => !prev);
    else { setActiveTool(tool); setIsPropertiesPanelOpen(true); }
  };

  const handleAttemptEditBackground = () => setIsBgConvertModalOpen(true);

  const handleConfirmConvertToLayer = () => {
    const newLayers = currentLayers.map(l => l.isBackground ? { ...l, name: 'Layer 0', isLocked: false, isBackground: false } : l);
    commit(newLayers);
    setIsBgConvertModalOpen(false);
  };

  const handleExport = (format: ExportFormat, quality?: number) => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = documentSettings.width;
    compositeCanvas.height = documentSettings.height;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    currentLayers.forEach(layer => {
      if (layer.isVisible && layer.imageData) {
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = documentSettings.width;
        layerCanvas.height = documentSettings.height;
        const layerCtx = layerCanvas.getContext('2d');
        if (layerCtx) {
          layerCtx.putImageData(layer.imageData, 0, 0);
          ctx.globalAlpha = layer.opacity;
          ctx.globalCompositeOperation = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
          ctx.drawImage(layerCanvas, 0, 0);
        }
      }
    });
    
    const dataUrl = compositeCanvas.toDataURL(format, quality);
    const link = document.createElement('a');
    link.href = dataUrl;
    const extension = format.split('/')[1];
    link.download = `${documentSettings.name}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProject = () => saveProject(documentSettings, currentLayers);
  
  const handleOpenProjectClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const { documentSettings: newDoc, layers: newLayers } = await loadProject(file);
            // This is a destructive action, replacing the current project.
            // A more complex app might ask for confirmation.
            setHistory([newLayers]);
            setHistoryIndex(0);
            setActiveLayerId(newLayers[newLayers.length - 1]?.id ?? null);
            // The document settings are part of the project, but we don't have a way to update them in App.tsx from here.
            // For now, we assume the user stays within the same canvas size. A full implementation would need to communicate this up.
            console.log("Project loaded. Note: document settings (like canvas size) are not dynamically updated in this version.");

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

  return (
    <div className="flex flex-col h-screen bg-[#181818] text-gray-300 font-sans text-sm">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".aips" className="hidden" />
      <EditorHeader
        documentName={documentSettings.name}
        onClose={onClose} onNew={onNew} onSaveAs={() => setIsExportModalOpen(true)}
        onSaveProject={handleSaveProject} onOpenProject={handleOpenProjectClick}
        canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo}
        zoom={zoom} onZoomChange={setZoom}
      />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />
        {isPropertiesPanelOpen && (
            <PropertiesPanel 
              activeTool={activeTool}
              autoSelect={'Layer'} onAutoSelectChange={() => {}}
              onClose={() => setIsPropertiesPanelOpen(false)}
            />
        )}
        <main className="flex-1 flex flex-col bg-[#181818] overflow-hidden">
          <CanvasArea
            document={documentSettings} layers={currentLayers} activeLayerId={activeLayerId}
            activeTool={activeTool} zoom={zoom} onZoom={handleZoom}
            selection={selection} onSelectionChange={handleSelectionChange}
            selectionPreview={selectionPreview} onSelectionPreview={onSelectionPreview}
            onDrawEnd={handleDrawEnd} onAttemptEditBackgroundLayer={handleAttemptEditBackground}
            foregroundColor="#000" brushSize={10} brushOpacity={1} brushHardness={1}
            brushShape="round" fontFamily="sans-serif" fontSize={12} textAlign="left"
          />
        </main>
        <LayersPanel
          layers={currentLayers} activeLayerId={activeLayerId}
          onSelectLayer={setActiveLayerId} onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer} onUpdateLayerProps={handleUpdateLayerProps}
          onDuplicateLayer={handleDuplicateLayer} onMergeDown={handleMergeDown}
        />
      </div>
      <ConfirmModal
        isOpen={isBgConvertModalOpen} onClose={() => setIsBgConvertModalOpen(false)}
        onConfirm={handleConfirmConvertToLayer} title="Convert Background Layer?"
        confirmText="Convert to Layer"
      >
        <p>The Background layer is locked. To make changes, please convert it to a normal layer.</p>
      </ConfirmModal>
      <ExportModal
        isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport} documentName={documentSettings.name}
      />
    </div>
  );
};

export default Editor;
