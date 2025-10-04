
import React, { useState, useRef, useEffect } from 'react';
import { EditorTool, DocumentSettings, Layer, BrushShape, TextAlign, TransformSubTool, PaintSubTool } from '../../types';
import Canvas from '../ui/Canvas';
import TransformControls from './TransformControls';
import { MoveActionBar, TransformActionBar, CropActionBar, AddImageActionBar } from './FloatingActionBar';

const MIN_ZOOM = 0.05; // 5%
const MAX_ZOOM = 32; // 3200%

interface TransformSession {
    layerId: string;
    initialLayerState: Layer;
    transform: DOMMatrix;
    isAspectRatioLocked: boolean;
}

interface CanvasAreaProps {
  document: DocumentSettings;
  layers: Layer[];
  activeLayerId: string | null;
  activeTool: EditorTool;
  activeSubTool: TransformSubTool;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
  selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionChange: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  selectionPreview: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionPreview: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
  onAttemptEditBackgroundLayer: () => void;
  onUpdateLayerPosition: (id: string, x: number, y: number) => void;
  // Transform Props
  transformSession: TransformSession | null;
  onTransformStart: (layerId: string) => void;
  onTransformUpdate: (transform: DOMMatrix) => void;
  onTransformCommit: () => void;
  onTransformCancel: () => void;
  // Tool props
  activePaintSubTool: PaintSubTool;
  foregroundColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  brushShape: BrushShape;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
}

const CanvasArea: React.FC<CanvasAreaProps> = (props) => {
  const { document: docSettings, layers, activeLayerId, activeTool, activeSubTool, zoom, onZoom, selection, onSelectionChange, selectionPreview, onSelectionPreview, onDrawEnd, onAttemptEditBackgroundLayer, onUpdateLayerPosition, transformSession, onTransformStart, onTransformUpdate, onTransformCommit, onTransformCancel, ...toolProps } = props;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<React.ElementRef<typeof Canvas>>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const marchOffset = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Center canvas on load
    const container = containerRef.current;
    if (container) {
        const { clientWidth, clientHeight } = container;
        const initialPanX = (clientWidth - docSettings.width * zoom) / 2;
        const initialPanY = (clientHeight - docSettings.height * zoom) / 2;
        setPan({ x: initialPanX, y: initialPanY });
    }
  }, [docSettings.width, docSettings.height]); // Only run once on document change


  // Main compositing effect
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = docSettings.width;
    offscreenCanvas.height = docSettings.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;

    layers.forEach(layer => {
      const isTransformingThisLayer = transformSession && transformSession.layerId === layer.id;
      if (!layer.isVisible && !isTransformingThisLayer) return;

      const imageData = isTransformingThisLayer ? transformSession.initialLayerState.imageData : layer.imageData;
      if (!imageData) return;

      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      offscreenCtx.putImageData(imageData, 0, 0);

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.isBackground ? 'source-over' : layer.blendMode;
      
      if (isTransformingThisLayer) {
        ctx.setTransform(transformSession.transform);
        ctx.drawImage(offscreenCanvas, 0, 0);
      } else {
        ctx.setTransform(1, 0, 0, 1, layer.x, layer.y);
        ctx.drawImage(offscreenCanvas, 0, 0);
      }
      ctx.restore();
    });
  }, [layers, docSettings.width, docSettings.height, transformSession]);


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    if (e.altKey) { // Zooming with Alt key
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pointX = (mouseX - pan.x) / zoom;
        const pointY = (mouseY - pan.y) / zoom;
        
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
        
        const newPanX = mouseX - pointX * clampedZoom;
        const newPanY = mouseY - pointY * clampedZoom;

        setPan({ x: newPanX, y: newPanY });
        onZoom(clampedZoom);

    } else { // Panning logic
        const panSpeed = 1;
        let dx = e.deltaX;
        let dy = e.deltaY;
        
        if (e.shiftKey && dy !== 0) {
            dx += dy;
            dy = 0;
        }

        setPan(prevPan => ({
            x: prevPan.x - dx * panSpeed,
            y: prevPan.y - dy * panSpeed,
        }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) { 
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      e.preventDefault();
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning.current) {
        isPanning.current = false;
        if (containerRef.current) containerRef.current.style.cursor = 'default';
    }
  };

  useEffect(() => {
    const selectionCanvas = selectionCanvasRef.current;
    if (!selectionCanvas) return;
    const ctx = selectionCanvas.getContext('2d');
    if (!ctx) return;

    const rectToDraw = selectionPreview?.rect || selection?.rect;

    const animate = () => {
      marchOffset.current = (marchOffset.current + 0.5) % 8;
      ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
      
      if (rectToDraw) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.lineDashOffset = -marchOffset.current;
        ctx.strokeRect(rectToDraw.x, rectToDraw.y, rectToDraw.width, rectToDraw.height);
        
        ctx.strokeStyle = 'black';
        ctx.lineDashOffset = -marchOffset.current + (4 / zoom);
        ctx.strokeRect(rectToDraw.x, rectToDraw.y, rectToDraw.width, rectToDraw.height);
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (rectToDraw) animate();
    else ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [selection, selectionPreview, zoom]);
  
  const activeLayer = layers.find(l => l.id === activeLayerId);
  const showTransformControls = activeTool === EditorTool.TRANSFORM && activeSubTool === 'transform' && activeLayer && !activeLayer.isBackground && !activeLayer.isLocked;

  const isTransforming = !!transformSession;
  const isCropping = activeTool === EditorTool.TRANSFORM && activeSubTool === 'crop';
  
  const renderFloatingActionBar = () => {
    if (isTransforming) {
        return <TransformActionBar onCancel={onTransformCancel} onDone={onTransformCommit} />;
    }
    if (isCropping) {
        return <CropActionBar onCancel={() => {}} onDone={() => {}} />;
    }
    if (activeTool === EditorTool.TRANSFORM && activeSubTool === 'move') {
        return <MoveActionBar />;
    }
    if (activeTool === EditorTool.ADD_IMAGE) {
        return <AddImageActionBar />;
    }
    return null;
  }
  
  const isDrawingToolActive = [EditorTool.PAINT, EditorTool.TYPE, EditorTool.SHAPES, EditorTool.SELECT].includes(activeTool);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-center overflow-hidden relative bg-repeat"
      style={{
         backgroundColor: '#181818',
         backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
         backgroundSize: '20px 20px',
         cursor: isPanning.current ? 'grabbing' : 'default',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div 
            className="shadow-2xl relative" 
            style={{ 
                width: docSettings.width, 
                height: docSettings.height,
                backgroundImage: 'repeating-conic-gradient(#374151 0 25%, transparent 0 50%)', 
                backgroundSize: '20px 20px'
            }}
        >
            <canvas
                ref={displayCanvasRef}
                width={docSettings.width}
                height={docSettings.height}
                className="absolute top-0 left-0"
            />
            {isDrawingToolActive && (
              <Canvas
                  ref={interactionCanvasRef}
                  width={docSettings.width}
                  height={docSettings.height}
                  activeTool={activeTool}
                  isLocked={activeLayer?.isLocked || isTransforming}
                  isBackground={activeLayer?.isBackground}
                  onAttemptEditBackgroundLayer={onAttemptEditBackgroundLayer}
                  selectionRect={selection?.rect || null}
                  onSelectionChange={onSelectionChange}
                  onSelectionPreview={onSelectionPreview}
                  imageDataToRender={null} // Interaction canvas is always clear initially
                  onDrawEnd={onDrawEnd}
                  zoom={zoom}
                  {...toolProps}
              />
            )}
             <canvas
              ref={selectionCanvasRef}
              width={docSettings.width}
              height={docSettings.height}
              className="absolute top-0 left-0 pointer-events-none"
            />
            {showTransformControls && activeLayer && (
                <TransformControls 
                    layer={activeLayer}
                    docWidth={docSettings.width}
                    docHeight={docSettings.height}
                    zoom={zoom}
                    transformSession={transformSession}
                    onTransformStart={onTransformStart}
                    onTransformUpdate={onTransformUpdate}
                />
            )}
        </div>
      </div>
      {renderFloatingActionBar()}
    </div>
  );
};

export default CanvasArea;
