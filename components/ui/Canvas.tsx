
import React, { useRef, useEffect, useImperativeHandle, useState } from 'react';
import { EditorTool, BrushShape, TextAlign } from '../../types';

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasProps {
  width: number;
  height: number;
  foregroundColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  brushShape: BrushShape;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
  activeTool: EditorTool;
  isLocked: boolean;
  isBackground?: boolean;
  onAttemptEditBackgroundLayer?: () => void;
  selectionRect: { x: number, y: number, width: number, height: number } | null;
  onSelectionChange: (rect: { x: number, y: number, width: number, height: number } | null) => void;
  onSelectionPreview: (rect: { x: number, y: number, width: number, height: number } | null) => void;
  imageDataToRender: ImageData | null;
  onDrawEnd: (imageData: ImageData) => void;
  zoom?: number;
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
  (props, ref) => {
    const { 
        width, height, foregroundColor, brushSize, brushOpacity, brushHardness, 
        brushShape, fontSize, fontFamily, textAlign, activeTool, isLocked, isBackground,
        onAttemptEditBackgroundLayer, selectionRect, onSelectionChange, onSelectionPreview, 
        imageDataToRender, onDrawEnd, zoom = 1 
    } = props;
    
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const interactionCanvasRef = useRef<HTMLCanvasElement>(null);

    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const shapeStartPos = useRef<{ x: number, y: number } | null>(null);

    const isMovingSelection = useRef(false);
    const movingSelection = useRef<{ data: ImageData; startX: number; startY: number, originalRect: { x: number; y: number; width: number; height: number; } } | null>(null);

    const [textEdit, setTextEdit] = useState<{ x: number, y: number, value: string } | null>(null);

    const getDrawingCtx = () => drawingCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    const getInteractionCtx = () => interactionCanvasRef.current?.getContext('2d');

    useImperativeHandle(ref, () => ({
      getCanvas: () => drawingCanvasRef.current,
    }));
    
    const handleDrawEnd = () => {
        const ctx = getDrawingCtx();
        const canvas = drawingCanvasRef.current;
        if (!ctx || !canvas) return;
        onDrawEnd(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    const finalizeTextInput = () => {
        if (!textEdit || !textEdit.value) {
            setTextEdit(null);
            return;
        }
        const ctx = getDrawingCtx();
        if (ctx) {
            if (selectionRect) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
                ctx.clip();
            }

            ctx.fillStyle = foregroundColor;
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'top';
            ctx.fillText(textEdit.value, textEdit.x, textEdit.y);
            
            if (selectionRect) {
                ctx.restore();
            }
            handleDrawEnd();
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
        const { r: fillR, g: fillG, b: fillB } = hexToRgb(foregroundColor);

        if (startColor[0] === fillR && startColor[1] === fillG && startColor[2] === fillB && startColor[3] === 255) return;

        const pixelStack = [[startX, startY]];
        while (pixelStack.length > 0) {
            const [x, y] = pixelStack.pop()!;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            if (selectionRect) {
                if (x < selectionRect.x || x >= selectionRect.x + selectionRect.width || y < selectionRect.y || y >= selectionRect.y + selectionRect.height) {
                    continue;
                }
            }
            
            const currentPos = (y * width + x) * 4;

            if (data[currentPos] !== startColor[0] || data[currentPos + 1] !== startColor[1] || data[currentPos + 2] !== startColor[2] || data[currentPos + 3] !== startColor[3]) continue;

            data[currentPos] = fillR;
            data[currentPos + 1] = fillG;
            data[currentPos + 2] = fillB;
            data[currentPos + 3] = 255;

            pixelStack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        ctx.putImageData(imageData, 0, 0);
        handleDrawEnd();
    };
    
    // Brush stamping function with hardness
    const stamp = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const radgrad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
      const { r, g, b } = hexToRgb(foregroundColor);
      const colorWithOpacity = `rgba(${r}, ${g}, ${b}, ${brushOpacity})`;
      const transparentColor = `rgba(${r}, ${g}, ${b}, 0)`;

      radgrad.addColorStop(0, colorWithOpacity);
      radgrad.addColorStop(Math.max(0.01, brushHardness), colorWithOpacity);
      radgrad.addColorStop(1, transparentColor);

      ctx.fillStyle = radgrad;
      
      if (brushShape === 'square') {
          ctx.fillRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
      } else { // round
          ctx.beginPath();
          ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
      }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const isDrawingTool = [EditorTool.BRUSH, EditorTool.ERASER, EditorTool.FILL, EditorTool.TEXT, EditorTool.SHAPES].includes(activeTool);
        
        if (isBackground && isDrawingTool) {
            onAttemptEditBackgroundLayer?.();
            return;
        }

        if (isLocked) return;

        finalizeTextInput();
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        if (selectionRect && isDrawingTool) {
            const { x: sx, y: sy, width: sw, height: sh } = selectionRect;
            if (x < sx || x >= sx + sw || y < sy || y >= sy + sh) {
                return; // Click is outside selection, do nothing for drawing tools
            }
        }

        if (activeTool === EditorTool.MOVE) {
            if (selectionRect) {
                const { x: sx, y: sy, width: sw, height: sh } = selectionRect;
                if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
                    isMovingSelection.current = true;
                    const drawCtx = getDrawingCtx();
                    if (drawCtx) {
                        const selectionData = drawCtx.getImageData(sx, sy, sw, sh);
                        movingSelection.current = { data: selectionData, startX: x, startY: y, originalRect: selectionRect };
                        drawCtx.clearRect(sx, sy, sw, sh);
                        // Do not clear final selection, just the content
                    }
                    return;
                }
            }
            // If not moving a selection, it's a pan event. Let it bubble up to CanvasArea.
            return;
        }


        switch (activeTool) {
            case EditorTool.BRUSH:
            case EditorTool.ERASER:
                isDrawing.current = true;
                lastPos.current = { x, y };
                const drawCtx = getDrawingCtx();
                if (drawCtx) {
                    drawCtx.save(); // Save context state before clipping
                    if (selectionRect) {
                        drawCtx.beginPath();
                        drawCtx.rect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
                        drawCtx.clip();
                    }
                    drawCtx.globalCompositeOperation = activeTool === EditorTool.ERASER ? 'destination-out' : 'source-over';
                    stamp(drawCtx, x, y);
                }
                break;
            case EditorTool.FILL:
                floodFill(Math.round(x), Math.round(y));
                break;
            case EditorTool.TEXT:
                setTextEdit({ x, y, value: '' });
                break;
            case EditorTool.SELECTION:
            case EditorTool.SHAPES:
                isDrawing.current = true;
                shapeStartPos.current = { x, y };
                break;
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isLocked) return;
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        if (isMovingSelection.current && movingSelection.current) {
             const { startX, startY, originalRect } = movingSelection.current;
            const newX = originalRect.x + (x - startX);
            const newY = originalRect.y + (y - startY);
            onSelectionChange({ ...originalRect, x: newX, y: newY });
            return;
        }
        
        if (!isDrawing.current) return;
        
        const drawCtx = getDrawingCtx();
        const interactCtx = getInteractionCtx();

        switch (activeTool) {
            case EditorTool.BRUSH:
            case EditorTool.ERASER:
                if (!drawCtx || !lastPos.current) return;
                
                const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
                const angle = Math.atan2(y - lastPos.current.y, x - lastPos.current.x);
                
                // Interpolate for a smooth stroke
                for (let i = 0; i < dist; i += Math.max(1, brushSize / 20)) {
                    const currentX = lastPos.current.x + Math.cos(angle) * i;
                    const currentY = lastPos.current.y + Math.sin(angle) * i;
                    stamp(drawCtx, currentX, currentY);
                }
                stamp(drawCtx, x, y); // Ensure the end point is stamped
                lastPos.current = { x, y };
                break;
            case EditorTool.SELECTION:
                 if (shapeStartPos.current) {
                    const previewRect = {
                        x: Math.min(shapeStartPos.current.x, x),
                        y: Math.min(shapeStartPos.current.y, y),
                        width: Math.abs(x - shapeStartPos.current.x),
                        height: Math.abs(y - shapeStartPos.current.y),
                    };
                    onSelectionPreview(previewRect);
                }
                break;
            case EditorTool.SHAPES:
                if (interactCtx && shapeStartPos.current) {
                    interactCtx.clearRect(0, 0, width, height);
                    interactCtx.strokeStyle = foregroundColor;
                    interactCtx.lineWidth = 2; // Fixed for shapes for now
                    interactCtx.strokeRect(shapeStartPos.current.x, shapeStartPos.current.y, x - shapeStartPos.current.x, y - shapeStartPos.current.y);
                }
                break;
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isLocked) return;
        if (isMovingSelection.current && movingSelection.current) {
            const drawCtx = getDrawingCtx();
            const { data, originalRect, startX, startY } = movingSelection.current;
            if (drawCtx && selectionRect) {
                drawCtx.putImageData(data, selectionRect.x, selectionRect.y);
                handleDrawEnd();
            }
            isMovingSelection.current = false;
            movingSelection.current = null;
            return;
        }
        
        if (!isDrawing.current) return;

        const drawCtx = getDrawingCtx();
        isDrawing.current = false;
        
        if (drawCtx) {
             switch (activeTool) {
                case EditorTool.BRUSH:
                case EditorTool.ERASER:
                    drawCtx.restore(); // Restore context to remove clipping
                    handleDrawEnd();
                    break;
                case EditorTool.SHAPES:
                     if (shapeStartPos.current) {
                        const rect = drawingCanvasRef.current!.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / zoom;
                        const y = (e.clientY - rect.top) / zoom;
                        
                        if (selectionRect) {
                            drawCtx.save();
                            drawCtx.beginPath();
                            drawCtx.rect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
                            drawCtx.clip();
                        }
                        
                        drawCtx.strokeStyle = foregroundColor;
                        drawCtx.lineWidth = 2;
                        drawCtx.strokeRect(shapeStartPos.current.x, shapeStartPos.current.y, x - shapeStartPos.current.x, y - shapeStartPos.current.y);
                        
                        if (selectionRect) {
                            drawCtx.restore();
                        }

                        getInteractionCtx()?.clearRect(0, 0, width, height);
                        handleDrawEnd();
                    }
                    break;
                case EditorTool.SELECTION:
                    onSelectionPreview(null);
                    if (shapeStartPos.current) {
                        const rect = drawingCanvasRef.current!.getBoundingClientRect();
                        const endX = (e.clientX - rect.left) / zoom;
                        const endY = (e.clientY - rect.top) / zoom;
                        const finalRect = {
                            x: Math.min(shapeStartPos.current.x, endX),
                            y: Math.min(shapeStartPos.current.y, endY),
                            width: Math.abs(endX - shapeStartPos.current.x),
                            height: Math.abs(endY - shapeStartPos.current.y),
                        };
                        if (finalRect.width > 2 && finalRect.height > 2) {
                            onSelectionChange(finalRect);
                        } else {
                            onSelectionChange(null);
                        }
                    }
                    break;
            }
            drawCtx.globalCompositeOperation = 'source-over';
        }
        lastPos.current = null;
        shapeStartPos.current = null;
    };

    useEffect(() => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      if (isLocked) {
        canvas.style.cursor = 'not-allowed';
        return;
      }

      switch (activeTool) {
          case EditorTool.MOVE:
              canvas.style.cursor = 'move';
              break;
          case EditorTool.SELECTION:
          case EditorTool.SHAPES:
          case EditorTool.CROP:
          case EditorTool.TRANSFORM:
              canvas.style.cursor = 'crosshair';
              break;
          case EditorTool.TEXT:
              canvas.style.cursor = 'text';
              break;
          case EditorTool.BRUSH:
          case EditorTool.ERASER:
          case EditorTool.FILL:
              canvas.style.cursor = 'none'; // Use custom cursor from CanvasArea
              break;
          default:
              canvas.style.cursor = 'default';
      }
    }, [activeTool, isLocked]);

    useEffect(() => {
        const ctx = getDrawingCtx();
        if (!ctx) return;
        if (imageDataToRender) {
            ctx.putImageData(imageDataToRender, 0, 0);
        } else {
            ctx.clearRect(0, 0, width, height);
        }
    }, [imageDataToRender, width, height]);


    return (
      <div style={{ width, height }} className="absolute top-0 left-0">
        <canvas
            ref={drawingCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => { if(isDrawing.current || isMovingSelection.current) handleMouseUp(e);}}
        />
        <canvas
            ref={interactionCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 pointer-events-none"
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
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    border: '1px dotted #888',
                    background: 'rgba(0,0,0,0.5)',
                    color: foregroundColor,
                    font: `${fontSize}px ${fontFamily}`,
                    textAlign: textAlign,
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