import React, { useState, useRef } from 'react';
import { DocumentSettings, EditorTool } from '../../types';
import Canvas from '../ui/Canvas';

/**
 * @file This file defines the component that contains and centers the main canvas within the editor.
 */

interface CanvasAreaProps {
  document: DocumentSettings;
  activeTool: EditorTool;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
}

/**
 * Renders the main canvas area, ensuring it is centered within the workspace.
 * This component acts as a "stage" for the interactive Canvas, handling zoom and pan.
 */
const CanvasArea: React.FC<CanvasAreaProps> = ({ document, activeTool, zoom, onZoom }) => {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    onZoom(zoom + delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent pan when interacting with canvas itself
    const canvasWrapper = e.currentTarget.querySelector('#canvas-wrapper');
    if (canvasWrapper && canvasWrapper.contains(e.target as Node)) {
        return;
    }
    
    e.preventDefault();
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
        containerRef.current.style.userSelect = 'none';
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current?.style.cursor !== 'grabbing') return;
    e.preventDefault();
    setPan({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  };

  const handleMouseUp = () => {
    if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
        containerRef.current.style.userSelect = 'auto';
    }
  };

  /**
   * Determines the canvas background color based on document settings.
   * @returns {string} A CSS color string or 'transparent'.
   */
  const getBackgroundColor = (): string => {
    if (document.background === 'Custom') return document.customBgColor;
    if (document.background === 'Transparent') return 'transparent';
    return document.background.toLowerCase();
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center items-center overflow-hidden cursor-grab"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div id="canvas-wrapper" className="shadow-2xl bg-black">
          <Canvas
            width={document.width}
            height={document.height}
            backgroundColor={getBackgroundColor()}
            activeTool={activeTool}
            brushColor="#FFFFFF" // Placeholder
            brushSize={10}       // Placeholder
          />
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
