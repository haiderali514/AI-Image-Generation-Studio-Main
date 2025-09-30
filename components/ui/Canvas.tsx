
import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import { EditorTool } from '../../types';

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
  backgroundColor?: string;
  brushColor: string;
  brushSize: number;
  brushOpacity?: number;
  brushShape?: BrushShape;
  clearToken?: number;
  activeTool: EditorTool;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
}

const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};


const Canvas = React.forwardRef<CanvasHandle, CanvasProps>(
  ({ width, height, backgroundImage, backgroundColor = 'transparent', brushColor, brushSize, brushOpacity = 1, brushShape = 'round', clearToken = 0, activeTool, onHistoryChange }, ref) => {
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const shapeStartPos = useRef<{ x: number, y: number } | null>(null);
    const preShapeState = useRef<ImageData | null>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [textEdit, setTextEdit] = useState<{ x: number, y: number, value: string } | null>(null);

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

    const finalizeTextInput = () => {
        if (!textEdit || !textEdit.value) {
            setTextEdit(null);
            return;
        }
        const ctx = getDrawingCtx();
        if (ctx) {
            ctx.fillStyle = brushColor;
            ctx.font = `${brushSize * 2}px sans-serif`; // Font size based on brush size
            ctx.textBaseline = 'top';
            ctx.fillText(textEdit.value, textEdit.x, textEdit.y);
            saveState();
        }
        setTextEdit(null);
    };

    const floodFill = (startX: number, startY: number) => {
        const ctx = getDrawingCtx();
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const startPos = (startY * width + startX) * 4;
        const startColor = [data[startPos], data[startPos + 1], data[startPos + 2], data[startPos + 3]];
        const { r: fillR, g: fillG, b: fillB } = hexToRgb(brushColor);

        if (startColor[0] === fillR && startColor[1] === fillG && startColor[2] === fillB && startColor[3] === 255) return;

        const pixelStack = [[startX, startY]];
        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop()!;
            const currentPos = (y * width + x) * 4;

            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (data[currentPos] !== startColor[0] || data[currentPos + 1] !== startColor[1] || data[currentPos + 2] !== startColor[2] || data[currentPos + 3] !== startColor[3]) continue;

            data[currentPos] = fillR;
            data[currentPos + 1] = fillG;
            data[currentPos + 2] = fillB;
            data[currentPos + 3] = 255;

            pixelStack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        ctx.putImageData(imageData, 0, 0);
        saveState();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        finalizeTextInput();
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (activeTool) {
            case EditorTool.BRUSH:
            case EditorTool.ERASER:
                isDrawing.current = true;
                lastPos.current = { x, y };
                const drawCtx = getDrawingCtx();
                if (drawCtx) {
                    drawCtx.globalCompositeOperation = activeTool === EditorTool.ERASER ? 'destination-out' : 'source-over';
                    drawCtx.beginPath(); // Start a new path
                }
                break;
            case EditorTool.FILL:
                floodFill(Math.round(x), Math.round(y));
                break;
            case EditorTool.TEXT:
                setTextEdit({ x, y, value: '' });
                break;
            case EditorTool.SHAPES:
                isDrawing.current = true;
                shapeStartPos.current = { x, y };
                const shapeCtx = getDrawingCtx();
                if (shapeCtx) {
                    preShapeState.current = shapeCtx.getImageData(0, 0, width, height);
                }
                break;
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current) return;
        const ctx = getDrawingCtx();
        if (!ctx) return;
        const rect = drawingCanvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (activeTool) {
            case EditorTool.BRUSH:
            case EditorTool.ERASER:
                ctx.globalAlpha = brushOpacity;
                ctx.strokeStyle = brushColor;
                ctx.lineWidth = brushSize;
                ctx.lineCap = brushShape;
                ctx.lineJoin = 'round';
                ctx.moveTo(lastPos.current?.x || x, lastPos.current?.y || y);
                ctx.lineTo(x, y);
                ctx.stroke();
                lastPos.current = { x, y };
                break;
            case EditorTool.SHAPES:
                if (preShapeState.current && shapeStartPos.current) {
                    ctx.putImageData(preShapeState.current, 0, 0);
                    ctx.strokeStyle = brushColor;
                    ctx.lineWidth = 2; // Fixed for shapes for now
                    ctx.strokeRect(shapeStartPos.current.x, shapeStartPos.current.y, x - shapeStartPos.current.x, y - shapeStartPos.current.y);
                }
                break;
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing.current) return;
        const ctx = getDrawingCtx();

        isDrawing.current = false;
        lastPos.current = null;
        shapeStartPos.current = null;
        preShapeState.current = null;

        if (ctx) {
             switch (activeTool) {
                case EditorTool.BRUSH:
                case EditorTool.ERASER:
                    ctx.closePath();
                    saveState();
                    break;
                case EditorTool.SHAPES:
                    saveState();
                    break;
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    useEffect(() => {
      if (onHistoryChange) {
        onHistoryChange({ canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1, });
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
      if (!bgCanvas || !bgCtx || !drawingCtx) return;
    
      bgCtx.clearRect(0, 0, width, height);
      if (backgroundColor !== 'transparent') {
        bgCtx.fillStyle = backgroundColor;
        bgCtx.fillRect(0, 0, width, height);
      }
      
      drawingCtx.clearRect(0, 0, width, height);

      if (backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = backgroundImage;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let newWidth = width, newHeight = height;
          if (width / height > aspectRatio) newWidth = height * aspectRatio;
          else newHeight = width / aspectRatio;
          const xOffset = (width - newWidth) / 2;
          const yOffset = (height - newHeight) / 2;
          bgCtx.drawImage(img, xOffset, yOffset, newWidth, newHeight);
        };
      }
      
      const initialImageData = drawingCtx.getImageData(0, 0, width, height);
      setHistory([initialImageData]);
      setHistoryIndex(0);
    }, [backgroundImage, width, height, clearToken, backgroundColor]);


    return (
      <div style={{ width, height }} className="relative">
        <canvas
            ref={backgroundCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 rounded-lg"
        />
        <canvas
            ref={drawingCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 border-2 border-gray-600 rounded-lg cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
        {textEdit && (
            <input
                type="text"
                value={textEdit.value}
                onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
                onBlur={finalizeTextInput}
                onKeyDown={(e) => { if (e.key === 'Enter') finalizeTextInput(); }}
                style={{
                    position: 'absolute',
                    left: textEdit.x,
                    top: textEdit.y,
                    border: '1px dotted #888',
                    background: 'rgba(0,0,0,0.5)',
                    color: brushColor,
                    font: `${brushSize * 2}px sans-serif`,
                    outline: 'none',
                    lineHeight: 1,
                    padding: 0,
                }}
                autoFocus
            />
        )}
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;
