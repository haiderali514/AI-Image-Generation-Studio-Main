import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';

type BrushShape = 'round' | 'butt' | 'square';

export interface CanvasHandle {
  undo: () => void;
  redo: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasProps {
  width: number;
  height: number;
  backgroundImage?: string;
  brushColor: string;
  brushSize: number;
  brushOpacity?: number;
  brushShape?: BrushShape;
  clearToken?: number;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

const Canvas = React.forwardRef<CanvasHandle, CanvasProps>(
  ({ width, height, backgroundImage, brushColor, brushSize, brushOpacity = 1, brushShape = 'round', clearToken = 0, onHistoryChange }, ref) => {
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const getDrawingCtx = () => drawingCanvasRef.current?.getContext('2d');
    const getBgCtx = () => backgroundCanvasRef.current?.getContext('2d');

    const saveState = () => {
      const ctx = getDrawingCtx();
      const canvas = drawingCanvasRef.current;
      if (!ctx || !canvas) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    };

    const restoreState = (index: number) => {
      const ctx = getDrawingCtx();
      if (!ctx || !history[index]) return;
      ctx.putImageData(history[index], 0, 0);
    };

    const undo = () => {
      if (historyIndex > 0) {
        setHistoryIndex(prev => prev - 1);
      }
    };

    const redo = () => {
      if (historyIndex < history.length - 1) {
        setHistoryIndex(prev => prev + 1);
      }
    };

    useImperativeHandle(ref, () => ({
      undo,
      redo,
      getCanvas: () => drawingCanvasRef.current,
    }));

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;
      
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      const ctx = getDrawingCtx();
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.globalAlpha = brushOpacity;
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = brushShape;
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastPos.current?.x || x, lastPos.current?.y || y);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastPos.current = { x, y };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      isDrawing.current = true;
      lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const stopDrawing = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      lastPos.current = null;
      saveState();
    };

    useEffect(() => {
      if (onHistoryChange) {
        onHistoryChange({
          canUndo: historyIndex > 0,
          canRedo: historyIndex < history.length - 1,
        });
      }
    }, [history, historyIndex, onHistoryChange]);

    useEffect(() => {
      if (history.length > 0 && historyIndex >= 0) {
        restoreState(historyIndex);
      }
    }, [historyIndex]);

    useEffect(() => {
      const bgCanvas = backgroundCanvasRef.current;
      const bgCtx = getBgCtx();
      const drawingCtx = getDrawingCtx();
      const drawingCanvas = drawingCanvasRef.current;
      if (!bgCanvas || !bgCtx || !drawingCtx || !drawingCanvas) return;
    
      // Clear canvases
      bgCtx.clearRect(0, 0, width, height);
      bgCtx.fillStyle = '#111827'; // bg-gray-900
      bgCtx.fillRect(0, 0, width, height);
      
      drawingCtx.clearRect(0, 0, width, height);

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = backgroundImage;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let newWidth = width;
          let newHeight = height;

          if (width / height > aspectRatio) {
              newWidth = height * aspectRatio;
          } else {
              newHeight = width / aspectRatio;
          }
          
          const xOffset = (width - newWidth) / 2;
          const yOffset = (height - newHeight) / 2;
          
          bgCtx.drawImage(img, xOffset, yOffset, newWidth, newHeight);
        };
      }
      
      const initialImageData = drawingCtx.getImageData(0, 0, width, height);
      setHistory([initialImageData]);
      setHistoryIndex(0);
    }, [backgroundImage, width, height, clearToken]);


    return (
      <div style={{ width, height }} className="relative">
        <canvas
            ref={backgroundCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 bg-gray-900 rounded-lg"
        />
        <canvas
            ref={drawingCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 border-2 border-gray-600 rounded-lg cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        />
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;