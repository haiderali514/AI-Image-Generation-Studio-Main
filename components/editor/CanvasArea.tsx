import React, { useState, useRef, useEffect } from 'react';
import { EditorTool, DocumentSettings, Layer, BrushShape, TextAlign, AnySubTool, TransformSession, SnapLine } from '../../types';
import Canvas from '../ui/Canvas';
import TransformControls from './TransformControls';

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
  pan: { x: number; y: number; };
  onPanChange: (pan: { x: number; y: number; }) => void;
  viewResetKey: number;
  selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionChange: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  selectionPreview: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionPreview: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
  onAddShapeLayer: (rect: { x: number, y: number, width: number, height: number }) => void;
  onAttemptEditBackgroundLayer: () => void;
  onSelectLayer: (id: string) => void;
  // Move Props
  moveSession: MoveSession | null;
  onMoveStart: (layerId: string, mouseX: number, mouseY: number) => void;
  onMoveUpdate: (mouseX: number, mouseY: number) => void;
  onMoveCommit: (finalMouseX: number, finalMouseY: number) => void;
  // Transform Props
  transformSession: TransformSession | null;
  onTransformStart: (layer: Layer, handle: string, e: React.MouseEvent, canvasMousePos: { x: number; y: number }, cursor: string) => void;
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
  snapLines: SnapLine[];
}

const CanvasArea: React.FC<CanvasAreaProps> = (props) => {
  const { document: docSettings, layers, activeLayerId, activeTool, activeSubTool, zoom, onZoom, pan, onPanChange, viewResetKey, selection, onSelectionChange, selectionPreview, onSelectionPreview, onDrawEnd, onAddShapeLayer, onAttemptEditBackgroundLayer, onSelectLayer, moveSession, onMoveStart, onMoveUpdate, onMoveCommit, transformSession, onTransformStart, onTransformUpdate, onTransformCommit, onTransformCancel, snapLines, ...toolProps } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const snapLinesCanvasRef = useRef<HTMLCanvasElement>(null);
  const marchOffset = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
        const { clientWidth, clientHeight } = container;
        const initialPanX = (clientWidth - docSettings.width * zoom) / 2;
        const initialPanY = (clientHeight - docSettings.height * zoom) / 2;
        onPanChange({ x: initialPanX, y: initialPanY });
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

      if (!layerToRender.isVisible) return;
      if (!layerToRender.imageData && layerToRender.type !== 'shape') return;


      ctx.save();
      ctx.globalAlpha = layerToRender.opacity;
      ctx.globalCompositeOperation = layerToRender.isBackground ? 'source-over' : (layerToRender.blendMode === 'normal' ? 'source-over' : layerToRender.blendMode);
      
      ctx.translate(layerToRender.x, layerToRender.y);
      ctx.rotate(layerToRender.rotation * Math.PI / 180);
      ctx.scale(layerToRender.scaleX, layerToRender.scaleY);
      ctx.translate(-layerToRender.width / 2, -layerToRender.height / 2);

      if (layerToRender.type === 'pixel' && layerToRender.imageData) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = layerToRender.width;
        offscreenCanvas.height = layerToRender.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        if (offscreenCtx) {
          offscreenCtx.putImageData(layerToRender.imageData, 0, 0);
          ctx.drawImage(offscreenCanvas, 0, 0);
        }
      } else if (layerToRender.type === 'shape' && layerToRender.shapeProps) {
        const { type, fill, stroke, strokeWidth } = layerToRender.shapeProps;
        if (type === 'rectangle') {
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fillRect(0, 0, layerToRender.width, layerToRender.height);
          }
          if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(0, 0, layerToRender.width, layerToRender.height);
          }
        }
      }

      ctx.restore();
    });
  }, [layers, docSettings.width, docSettings.height, transformSession]);


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

      onPanChange({ x: newPanX, y: newPanY });
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

      onPanChange({
        x: pan.x - dx,
        y: pan.y - dy
      });
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
      onPanChange({
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

    if (rectToDraw) {
        if (!animationFrameId.current) {
            animationFrameId.current = requestAnimationFrame(animate);
        }
    } else {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = undefined;
        }
        ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
    
    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, [selection, selectionPreview]);
  
  useEffect(() => {
      const snapCanvas = snapLinesCanvasRef.current;
      const ctx = snapCanvas?.getContext('2d');
      if (!ctx || !snapCanvas) return;
      
      ctx.clearRect(0, 0, snapCanvas.width, snapCanvas.height);
      
      if (snapLines.length > 0) {
          ctx.strokeStyle = '#FF00FF'; // Pink
          ctx.lineWidth = 1 / zoom;
          ctx.setLineDash([4 / zoom, 2 / zoom]);
          
          snapLines.forEach(line => {
              ctx.beginPath();
              if (line.type === 'vertical') {
                  ctx.moveTo(line.position, line.start);
                  ctx.lineTo(line.position, line.end);
              } else {
                  ctx.moveTo(line.start, line.position);
                  ctx.lineTo(line.end, line.position);
              }
              ctx.stroke();
          });
      }
  }, [snapLines, zoom]);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-gray-900 overflow-hidden relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute"
        style={{
          width: `${docSettings.width}px`,
          height: `${docSettings.height}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          background: docSettings.background === 'Transparent' 
              ? `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)`
              : 'transparent',
          backgroundSize: '20px 20px',
        }}
      >
        <canvas
          ref={displayCanvasRef}
          width={docSettings.width}
          height={docSettings.height}
          className="absolute top-0 left-0"
        />
        <canvas
            ref={selectionCanvasRef}
            width={docSettings.width}
            height={docSettings.height}
            className="absolute top-0 left-0 pointer-events-none"
        />
        <canvas
            ref={snapLinesCanvasRef}
            width={docSettings.width}
            height={docSettings.height}
            className="absolute top-0 left-0 pointer-events-none"
        />
        <Canvas
            width={docSettings.width}
            height={docSettings.height}
            isLocked={activeLayer?.isLocked ?? false}
            isBackground={activeLayer?.isBackground ?? false}
            onAttemptEditBackgroundLayer={onAttemptEditBackgroundLayer}
            selectionRect={selection?.rect ?? null}
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
            imageDataToRender={activeLayer?.type === 'pixel' ? activeLayer.imageData : null}
            onAddShapeLayer={onAddShapeLayer}
            {...toolProps}
            activeSubTool={activeSubTool}
            activeTool={activeTool}
        />
        {activeLayer && !activeLayer.isBackground && (activeSubTool === 'move' || activeSubTool === 'transform') && (
           <TransformControls 
                layer={activeLayer}
                zoom={zoom}
                pan={pan}
                onTransformStart={onTransformStart}
            />
        )}
      </div>
    </div>
  );
};

export default CanvasArea;
