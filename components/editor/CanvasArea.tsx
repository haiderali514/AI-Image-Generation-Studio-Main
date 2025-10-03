
import React, { useState, useRef, useEffect } from 'react';
import { EditorTool, DocumentSettings, Layer, BrushShape, TextAlign } from '../../types';
import Canvas from '../ui/Canvas';
import TransformControls from './TransformControls';
import FloatingActionBar from './FloatingActionBar';

const MIN_ZOOM = 0.05; // 5%
const MAX_ZOOM = 32; // 3200%

interface CanvasAreaProps {
  document: DocumentSettings;
  layers: Layer[];
  activeLayerId: string | null;
  activeTool: EditorTool;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
  selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionChange: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  selectionPreview: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionPreview: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
  onAttemptEditBackgroundLayer: () => void;
  // Tool props
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
  const { document: documentSettings, layers, activeLayerId, activeTool, zoom, onZoom, selection, onSelectionChange, selectionPreview, onSelectionPreview, onDrawEnd, onAttemptEditBackgroundLayer, ...toolProps } = props;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const marchOffset = useRef(0);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Center canvas on load
    const container = containerRef.current;
    if (container) {
        const { clientWidth, clientHeight } = container;
        const initialPanX = (clientWidth - documentSettings.width * zoom) / 2;
        const initialPanY = (clientHeight - documentSettings.height * zoom) / 2;
        setPan({ x: initialPanX, y: initialPanY });
    }
  }, [documentSettings.width, documentSettings.height]); // Only run once on document change


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    if (e.ctrlKey || e.metaKey) { // Zooming with Ctrl/Cmd key
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

    } else { // Panning with scroll wheel (or Shift for horizontal)
        const panSpeed = 1;
        setPan(prevPan => ({
            x: prevPan.x - e.deltaX * panSpeed,
            y: prevPan.y - e.deltaY * panSpeed,
        }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    // Pan with Spacebar + Click or Middle Mouse Button
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) { // Using Shift+Click for panning as Spacebar is hard to capture
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
  
  const docBg = documentSettings.background === 'Custom' ? documentSettings.customBgColor : documentSettings.background.toLowerCase();
  
  const activeLayer = layers.find(l => l.id === activeLayerId);
  const showTransformControls = activeTool === EditorTool.MOVE && activeLayer && activeLayer.imageData !== null && !activeLayer.isBackground;

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
        className="relative transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div className="shadow-2xl bg-black relative" style={{ width: documentSettings.width, height: documentSettings.height }}>
            
            {layers.map(layer => (
                <div key={layer.id}
                     style={{
                        display: layer.isVisible ? 'block' : 'none',
                        opacity: layer.isBackground ? 1 : layer.opacity, // Background doesn't have opacity control
                        mixBlendMode: layer.isBackground ? 'normal' : layer.blendMode,
                        pointerEvents: (layer.id === activeLayerId && !isPanning.current) ? 'auto' : 'none'
                     }}
                     className="absolute top-0 left-0 w-full h-full"
                >
                    <Canvas
                        width={documentSettings.width}
                        height={documentSettings.height}
                        activeTool={activeTool}
                        isLocked={layer.isLocked}
                        isBackground={layer.isBackground}
                        onAttemptEditBackgroundLayer={onAttemptEditBackgroundLayer}
                        selectionRect={selection?.rect || null}
                        onSelectionChange={onSelectionChange}
                        onSelectionPreview={onSelectionPreview}
                        imageDataToRender={layer.imageData}
                        onDrawEnd={onDrawEnd}
                        zoom={zoom}
                        {...toolProps}
                    />
                </div>
            ))}
             <canvas
              ref={selectionCanvasRef}
              width={documentSettings.width}
              height={documentSettings.height}
              className="absolute top-0 left-0 pointer-events-none"
            />
            {showTransformControls && <TransformControls width={documentSettings.width} height={documentSettings.height} zoom={zoom} />}
        </div>
      </div>
      {showTransformControls && <FloatingActionBar />}
    </div>
  );
};

export default CanvasArea;
