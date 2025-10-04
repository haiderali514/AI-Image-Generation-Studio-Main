
import React, { useState, useRef, useEffect } from 'react';
import { EditorTool, DocumentSettings, Layer, BrushShape, TextAlign, AnySubTool, TransformSession } from '../../types';
import Canvas from '../ui/Canvas';
import TransformControls from './TransformControls';
import { MoveActionBar, TransformActionBar, CropActionBar, AddImageActionBar } from './FloatingActionBar';

const MIN_ZOOM = 0.01; // 1%
const MAX_ZOOM = 5; // 500%

interface MoveSession {
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    layerStartX: number;
    layerStartY: number;
    currentMouseX: number;
    currentMouseY: number;
}

interface CanvasAreaProps {
  document: DocumentSettings;
  layers: Layer[];
  activeLayerId: string | null;
  activeTool: EditorTool;
  activeSubTool: AnySubTool;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
  viewResetKey: number;
  selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionChange: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  selectionPreview: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionPreview: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
  onAttemptEditBackgroundLayer: () => void;
  onSelectLayer: (id: string) => void;
  // Move Props
  moveSession: MoveSession | null;
  onMoveStart: (layerId: string, mouseX: number, mouseY: number) => void;
  onMoveUpdate: (mouseX: number, mouseY: number) => void;
  onMoveCommit: (finalMouseX: number, finalMouseY: number) => void;
  // Transform Props
  transformSession: TransformSession | null;
  onTransformStart: (layer: Layer, handle: string, e: React.MouseEvent) => void;
  onTransformUpdate: (newLayer: Layer) => void;
  onTransformCommit: () => void;
  onTransformCancel: () => void;
  // Tool props
  foregroundColor: string;
  backgroundColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  brushShape: BrushShape;
  fontFamily: string;
  fontSize: number;
  textAlign: TextAlign;
}

const CanvasArea: React.FC<CanvasAreaProps> = (props) => {
  const { document: docSettings, layers, activeLayerId, activeTool, activeSubTool, zoom, onZoom, viewResetKey, selection, onSelectionChange, selectionPreview, onSelectionPreview, onDrawEnd, onAttemptEditBackgroundLayer, onSelectLayer, moveSession, onMoveStart, onMoveUpdate, onMoveCommit, transformSession, onTransformStart, onTransformUpdate, onTransformCommit, onTransformCancel, ...toolProps } = props;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const marchOffset = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
        const { clientWidth, clientHeight } = container;
        const initialPanX = (clientWidth - docSettings.width * zoom) / 2;
        const initialPanY = (clientHeight - docSettings.height * zoom) / 2;
        setPan({ x: initialPanX, y: initialPanY });
    }
  }, [docSettings.width, docSettings.height, viewResetKey]);

  // Main compositing effect
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render layers from bottom to top
    [...layers].reverse().forEach(layer => {
      const isTransformingThisLayer = transformSession && transformSession.layer.id === layer.id;
      const layerToRender = isTransformingThisLayer ? transformSession!.layer : layer;

      if (!layerToRender.isVisible || !layerToRender.imageData) return;

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = layerToRender.width;
      offscreenCanvas.height = layerToRender.height;
      const offscreenCtx = offscreenCanvas.getContext('2d');
      if (!offscreenCtx) return;
      offscreenCtx.putImageData(layerToRender.imageData, 0, 0);

      ctx.save();
      ctx.globalAlpha = layerToRender.opacity;
      ctx.globalCompositeOperation = layerToRender.isBackground ? 'source-over' : (layerToRender.blendMode === 'normal' ? 'source-over' : layerToRender.blendMode);
      
      let renderX = layerToRender.x;
      let renderY = layerToRender.y;

      // Real-time move preview
      if (moveSession && moveSession.layerId === layer.id) {
        const deltaX = (moveSession.currentMouseX - moveSession.startMouseX) / zoom;
        const deltaY = (moveSession.currentMouseY - moveSession.startMouseY) / zoom;
        renderX = moveSession.layerStartX + deltaX;
        renderY = moveSession.layerStartY + deltaY;
      }
      
      ctx.translate(renderX, renderY);
      ctx.rotate(layerToRender.rotation * Math.PI / 180);
      ctx.scale(layerToRender.scaleX, layerToRender.scaleY);

      ctx.drawImage(offscreenCanvas, -layerToRender.width / 2, -layerToRender.height / 2);
      ctx.restore();
    });
  }, [layers, docSettings.width, docSettings.height, transformSession, moveSession, zoom]);


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    if (e.altKey) {
      // ALT + Scroll = Zoom
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const pointX = (mouseX - pan.x) / zoom;
      const pointY = (mouseY - pan.y) / zoom;
      
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
      
      // If zoom is at its limit, don't change pan, to prevent drifting
      if (clampedZoom === zoom) return;

      const newPanX = mouseX - pointX * clampedZoom;
      const newPanY = mouseY - pointY * clampedZoom;

      setPan({ x: newPanX, y: newPanY });
      onZoom(clampedZoom);
    } else {
      // Scroll = Pan
      let dx = e.deltaX;
      let dy = e.deltaY;

      // If shift is held and there's no native horizontal scroll,
      // convert vertical scroll to horizontal scroll.
      if (e.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }

      setPan(prevPan => ({
        x: prevPan.x - dx,
        y: prevPan.y - dy
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacebarDown) {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        return;
    }
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) { 
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
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
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' && !e.repeat && !isSpacebarDown) {
        e.preventDefault();
        setIsSpacebarDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        setIsSpacebarDown(false);
        isPanning.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacebarDown]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (isSpacebarDown) {
      container.style.cursor = isPanning.current ? 'grabbing' : 'grab';
    } else {
      container.style.cursor = 'default';
    }
  }, [isSpacebarDown, isPanning.current]);


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
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -marchOffset.current;
        ctx.strokeRect(rectToDraw.x, rectToDraw.y, rectToDraw.width, rectToDraw.height);
        
        ctx.strokeStyle = 'black';
        ctx.lineDashOffset = -marchOffset.current + 4;
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
  
  const isInteractionToolActive = [EditorTool.PAINT, EditorTool.TYPE, EditorTool.SHAPES, EditorTool.SELECT, EditorTool.TRANSFORM].includes(activeTool);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-center overflow-hidden relative bg-repeat"
      style={{
         backgroundColor: '#181818',
         backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
         backgroundSize: '20px 20px',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        <div 
            className="shadow-2xl relative" 
            style={{ 
                width: docSettings.width, 
                height: docSettings.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
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
            {isInteractionToolActive && (
              <Canvas
                  width={docSettings.width}
                  height={docSettings.height}
                  activeTool={activeTool}
                  activeSubTool={activeSubTool}
                  isLocked={activeLayer?.isLocked || isTransforming}
                  isBackground={activeLayer?.isBackground}
                  onAttemptEditBackgroundLayer={onAttemptEditBackgroundLayer}
                  selectionRect={selection?.rect || null}
                  onSelectionChange={onSelectionChange}
                  onSelectionPreview={onSelectionPreview}
                  onDrawEnd={onDrawEnd}
                  zoom={zoom}
                  layers={layers}
                  onSelectLayer={onSelectLayer}
                  moveSession={moveSession}
                  onMoveStart={onMoveStart}
                  onMoveUpdate={onMoveUpdate}
                  onMoveCommit={onMoveCommit}
                  isSpacebarDown={isSpacebarDown}
                  {...toolProps}
              />
            )}
             <canvas
              ref={selectionCanvasRef}
              width={docSettings.width}
              height={docSettings.height}
              className="absolute top-0 left-0 pointer-events-none"
            />
            {(showTransformControls || isTransforming) && activeLayer && (
                <TransformControls 
                    layer={transformSession?.layer ?? activeLayer}
                    zoom={zoom}
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
