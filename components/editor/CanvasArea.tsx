
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
  onUpdateLayerPosition: (id: string, x: number, y: number) => void;
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
  const { document: docSettings, layers, activeLayerId, activeTool, zoom, onZoom, selection, onSelectionChange, selectionPreview, onSelectionPreview, onDrawEnd, onAttemptEditBackgroundLayer, onUpdateLayerPosition, ...toolProps } = props;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  
  // State for layer movement
  const [movingLayerState, setMovingLayerState] = useState<{ id: string; x: number; y: number } | null>(null);
  const moveStartInfo = useRef<{ startX: number; startY: number; layerInitialX: number; layerInitialY: number; } | null>(null);
  const [activeGuides, setActiveGuides] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });
  const guidesCanvasRef = useRef<HTMLCanvasElement>(null);

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

    } else { // Panning with scroll wheel (or Shift for horizontal)
        const panSpeed = 1;
        setPan(prevPan => ({
            x: prevPan.x - e.deltaX * panSpeed,
            y: prevPan.y - e.deltaY * panSpeed,
        }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);

    // Layer Move
    if (activeTool === EditorTool.MOVE && activeLayer && !activeLayer.isLocked && !activeLayer.isBackground && e.button === 0 && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setMovingLayerState({ id: activeLayer.id, x: activeLayer.x, y: activeLayer.y });
        moveStartInfo.current = {
            startX: e.clientX,
            startY: e.clientY,
            layerInitialX: activeLayer.x,
            layerInitialY: activeLayer.y,
        };
        if (containerRef.current) containerRef.current.style.cursor = 'move';
        return;
    }

    // Pan with Spacebar + Click or Middle Mouse Button
    if (e.button === 1 || e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) { // Using Shift+Click for panning as Spacebar is hard to capture
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    // Layer Move
    if (movingLayerState && moveStartInfo.current) {
        e.preventDefault();
        const dx = (e.clientX - moveStartInfo.current.startX) / zoom;
        const dy = (e.clientY - moveStartInfo.current.startY) / zoom;
        
        let newX = moveStartInfo.current.layerInitialX + dx;
        let newY = moveStartInfo.current.layerInitialY + dy;
        
        // --- SNAPPING LOGIC ---
        const SNAP_THRESHOLD = 5 / zoom;
        const movingLayerBounds = {
            top: newY, left: newX,
            bottom: newY + docSettings.height, right: newX + docSettings.width,
            hCenter: newX + docSettings.width / 2, vCenter: newY + docSettings.height / 2,
        };

        const snapPoints = {
            x: [0, docSettings.width / 2, docSettings.width],
            y: [0, docSettings.height / 2, docSettings.height],
        };

        layers.forEach(layer => {
            if (layer.id !== movingLayerState.id && layer.isVisible && !layer.isBackground) {
                snapPoints.x.push(layer.x, layer.x + docSettings.width / 2, layer.x + docSettings.width);
                snapPoints.y.push(layer.y, layer.y + docSettings.height / 2, layer.y + docSettings.height);
            }
        });

        const newGuides = { x: [] as number[], y: [] as number[] };
        
        // Check horizontal snaps
        for (const targetX of snapPoints.x) {
            if (Math.abs(movingLayerBounds.left - targetX) < SNAP_THRESHOLD) { newX = targetX; newGuides.x.push(targetX); break; }
            if (Math.abs(movingLayerBounds.hCenter - targetX) < SNAP_THRESHOLD) { newX = targetX - docSettings.width / 2; newGuides.x.push(targetX); break; }
            if (Math.abs(movingLayerBounds.right - targetX) < SNAP_THRESHOLD) { newX = targetX - docSettings.width; newGuides.x.push(targetX); break; }
        }
        
        // Check vertical snaps
        for (const targetY of snapPoints.y) {
            if (Math.abs(movingLayerBounds.top - targetY) < SNAP_THRESHOLD) { newY = targetY; newGuides.y.push(targetY); break; }
            if (Math.abs(movingLayerBounds.vCenter - targetY) < SNAP_THRESHOLD) { newY = targetY - docSettings.height / 2; newGuides.y.push(targetY); break; }
            if (Math.abs(movingLayerBounds.bottom - targetY) < SNAP_THRESHOLD) { newY = targetY - docSettings.height; newGuides.y.push(targetY); break; }
        }

        setActiveGuides(newGuides);
        setMovingLayerState({ ...movingLayerState, x: newX, y: newY });
        return;
    }
    
    // Panning
    if (isPanning.current) {
      e.preventDefault();
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // End Layer Move
    if (movingLayerState) {
        onUpdateLayerPosition(movingLayerState.id, movingLayerState.x, movingLayerState.y);
        setMovingLayerState(null);
        moveStartInfo.current = null;
        setActiveGuides({ x: [], y: [] });
        if (containerRef.current) containerRef.current.style.cursor = 'default';
    }

    // End Panning
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
  
   useEffect(() => {
    const canvas = guidesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!movingLayerState) return;

    ctx.strokeStyle = '#FF00FF'; // Pink
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([5 / zoom, 3 / zoom]);

    const extend = 10000; // Extend guides far off-canvas

    activeGuides.x.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, -extend);
        ctx.lineTo(x, docSettings.height + extend);
        ctx.stroke();
    });
    activeGuides.y.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(-extend, y);
        ctx.lineTo(docSettings.width + extend, y);
        ctx.stroke();
    });

  }, [activeGuides, zoom, docSettings, movingLayerState]);
  
  const activeLayer = layers.find(l => l.id === activeLayerId);
  const showTransformControls = activeTool === EditorTool.MOVE && activeLayer && activeLayer.imageData !== null && !activeLayer.isBackground;

  const getLayerPosition = (layer: Layer) => {
    if (movingLayerState && movingLayerState.id === layer.id) {
        return { x: movingLayerState.x, y: movingLayerState.y };
    }
    return { x: layer.x, y: layer.y };
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-center overflow-hidden relative bg-repeat"
      style={{
         backgroundColor: '#181818',
         backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
         backgroundSize: '20px 20px',
         cursor: isPanning.current ? 'grabbing' : movingLayerState ? 'move' : 'default',
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
        <div className="shadow-2xl bg-black relative" style={{ width: docSettings.width, height: docSettings.height }}>
            {layers.map(layer => {
              const pos = getLayerPosition(layer);
              const isMovingThisLayer = movingLayerState?.id === layer.id;
              return (
                <div key={layer.id}
                     style={{
                        display: layer.isVisible ? 'block' : 'none',
                        opacity: layer.isBackground ? 1 : layer.opacity,
                        mixBlendMode: layer.isBackground ? 'normal' : layer.blendMode,
                        position: 'absolute',
                        top: `${pos.y}px`,
                        left: `${pos.x}px`,
                        width: `${docSettings.width}px`,
                        height: `${docSettings.height}px`,
                        outline: isMovingThisLayer ? `${1/zoom}px dashed #FF00FF` : 'none',
                        outlineOffset: `${1/zoom}px`,
                     }}
                >
                    <Canvas
                        width={docSettings.width}
                        height={docSettings.height}
                        activeTool={activeTool}
                        isLocked={layer.isLocked || isMovingThisLayer}
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
              )
            })}
             <canvas
              ref={guidesCanvasRef}
              width={docSettings.width}
              height={docSettings.height}
              className="absolute top-0 left-0 pointer-events-none"
            />
             <canvas
              ref={selectionCanvasRef}
              width={docSettings.width}
              height={docSettings.height}
              className="absolute top-0 left-0 pointer-events-none"
            />
            {showTransformControls && !movingLayerState && <TransformControls width={docSettings.width} height={docSettings.height} zoom={zoom} />}
        </div>
      </div>
      {showTransformControls && <FloatingActionBar />}
    </div>
  );
};

export default CanvasArea;