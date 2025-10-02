
import React, { useState, useRef } from 'react';
import { EditorTool, DocumentSettings, Layer, BrushShape, TextAlign } from '../../types';
import Canvas from '../ui/Canvas';

/**
 * @file This file defines the component that contains and centers the main canvas within the editor.
 */

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 16; // 1600%

interface CanvasAreaProps {
  document: DocumentSettings;
  layers: Layer[];
  activeLayerId: string | null;
  activeTool: EditorTool;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
  selection: { rect: { x: number; y: number; width: number; height: number; } } | null;
  onSelectionChange: (rect: { x: number; y: number; width: number; height: number; } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
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

/**
 * Renders the main canvas area, ensuring it is centered within the workspace.
 * This component acts as a "stage" for the interactive Canvas, handling zoom and pan.
 */
const CanvasArea: React.FC<CanvasAreaProps> = (props) => {
  const { document, layers, activeLayerId, activeTool, zoom, onZoom, selection, onSelectionChange, onDrawEnd, ...toolProps } = props;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { // Zooming with Ctrl/Cmd key
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Point on canvas before zoom
        const pointX = (mouseX - pan.x) / zoom;
        const pointY = (mouseY - pan.y) / zoom;
        
        const zoomFactor = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
        
        // New pan position to keep point under cursor
        const newPanX = mouseX - pointX * clampedZoom;
        const newPanY = mouseY - pointY * clampedZoom;

        setPan({ x: newPanX, y: newPanY });
        onZoom(clampedZoom);

    } else { // Panning with scroll wheel
        const panSpeed = 1; // Adjust this value for sensitivity
        setPan(prevPan => ({
            x: prevPan.x - e.deltaX * panSpeed,
            y: prevPan.y - e.deltaY * panSpeed,
        }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) {
      return;
    }

    // Pan with Move tool or Middle Mouse Button
    if (activeTool === EditorTool.MOVE || e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
        containerRef.current.style.userSelect = 'none';
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    
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
        if (containerRef.current) {
            containerRef.current.style.cursor = getCursor();
            containerRef.current.style.userSelect = 'auto';
        }
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    if (isPanning.current) {
      handleMouseUp(null as any);
    }
  };

  const getCursor = () => {
    if (isPanning.current) return 'grabbing';
    switch(activeTool) {
        case EditorTool.BRUSH:
        case EditorTool.ERASER:
            return 'none';
        case EditorTool.MOVE: 
            return 'grab';
        default: 
            return 'default';
    }
  }
  
  const isBrushToolActive = activeTool === EditorTool.BRUSH || activeTool === EditorTool.ERASER;

  const getBackgroundColor = (doc: DocumentSettings): string => {
    if (doc.background === 'Custom') return doc.customBgColor;
    if (doc.background === 'Transparent') return 'transparent';
    return doc.background.toLowerCase();
  };
  
  const docBg = getBackgroundColor(document);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-center overflow-hidden relative"
      style={{ cursor: getCursor() }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div className="shadow-2xl bg-black relative" style={{ width: document.width, height: document.height }}>
            <div 
              className="absolute top-0 left-0 w-full h-full"
              style={{
                 backgroundColor: docBg === 'transparent' ? '#444' : docBg,
                 backgroundImage: docBg === 'transparent' ? 'repeating-conic-gradient(#333 0 25%, transparent 0 50%)' : 'none',
                 backgroundSize: '20px 20px',
              }}
            />
            
            {layers.map(layer => (
                <div key={layer.id}
                     style={{
                        display: layer.isVisible ? 'block' : 'none',
                        opacity: layer.opacity,
                        mixBlendMode: layer.blendMode,
                        pointerEvents: (layer.id === activeLayerId && !isPanning.current) ? 'auto' : 'none'
                     }}
                     className="absolute top-0 left-0 w-full h-full"
                >
                    <Canvas
                        width={document.width}
                        height={document.height}
                        activeTool={activeTool}
                        isLocked={layer.isLocked}
                        selectionRect={selection?.rect || null}
                        onSelectionChange={onSelectionChange}
                        imageDataToRender={layer.history[layer.historyIndex] ?? null}
                        onDrawEnd={onDrawEnd}
                        zoom={zoom}
                        {...toolProps}
                    />
                </div>
            ))}
        </div>
         
         {/* Render selection rectangle */}
         {selection && (
            <div className="absolute border border-dashed border-white pointer-events-none" 
                 style={{ left: selection.rect.x, 
                          top: selection.rect.y,
                          width: selection.rect.width, 
                          height: selection.rect.height }} />
         )}
      </div>
      
      {/* Brush Preview Cursor */}
      {isBrushToolActive && mousePos && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: toolProps.brushSize * zoom,
            height: toolProps.brushSize * zoom,
            left: mousePos.x,
            top: mousePos.y,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px white, 0 0 0 2px black',
          }}
        />
      )}
    </div>
  );
};

export default CanvasArea;
