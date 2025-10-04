
import React, { useRef, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { EditorTool, BrushShape, TextAlign, AnySubTool, Layer, MoveSession } from '../../types';

// FIX: Export CanvasHandle type for use in parent components via refs.
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
  activeSubTool: AnySubTool;
  isLocked: boolean;
  isBackground?: boolean;
  onAttemptEditBackgroundLayer?: () => void;
  selectionRect: { x: number, y: number, width: number, height: number } | null;
  onSelectionChange: (rect: { x: number, y: number, width: number, height: number } | null) => void;
  onSelectionPreview: (rect: { x: number, y: number, width: number, height: number } | null) => void;
  onDrawEnd: (imageData: ImageData) => void;
  // FIX: Add onAddShapeLayer to props to allow creating new shape layers.
  onAddShapeLayer: (rect: { x: number, y: number, width: number, height: number }) => void;
  zoom?: number;
  layers: Layer[];
  onSelectLayer: (id: string) => void;
  moveSession: MoveSession | null;
  onMoveStart: (layerId: string, mouseX: number, mouseY: number) => void;
  onMoveUpdate: (mouseX: number, mouseY: number) => void;
  onMoveCommit: (finalMouseX: number, finalMouseY: number) => void;
  isSpacebarDown: boolean;
  imageDataToRender?: ImageData | null;
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


// FIX: Wrap Canvas in forwardRef to allow parent components to get a ref to it.
const Canvas = forwardRef<CanvasHandle, CanvasProps>((props, ref) => {
    const { 
        width, height, foregroundColor, brushSize, brushOpacity, brushHardness, 
        brushShape, fontSize, fontFamily, textAlign, activeTool, activeSubTool, isLocked, isBackground,
        onAttemptEditBackgroundLayer, selectionRect, onSelectionChange, onSelectionPreview, 
        onDrawEnd, zoom = 1, layers, onSelectLayer,
        moveSession, onMoveStart, onMoveUpdate, onMoveCommit, isSpacebarDown,
        imageDataToRender, onAddShapeLayer
    } = props;
    
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const interactionCanvasRef = useRef<HTMLDivElement>(null);

    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const shapeStartPos = useRef<{ x: number, y: number } | null>(null);

    const [textEdit, setTextEdit] = useState<{ x: number, y: number, value: string } | null>(null);

    // FIX: Expose getCanvas method via useImperativeHandle.
    useImperativeHandle(ref, () => ({
        getCanvas: () => drawingCanvasRef.current,
    }));

    // FIX: Add useEffect to draw imageDataToRender when it changes (for history/undo).
    useEffect(() => {
        const ctx = drawingCanvasRef.current?.getContext('2d');
        const canvas = drawingCanvasRef.current;
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (imageDataToRender) {
                ctx.putImageData(imageDataToRender, 0, 0);
            }
        }
    }, [imageDataToRender, width, height]);

    const getDrawingCtx = () => drawingCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    
    const handleDrawEnd = () => {
        const ctx = getDrawingCtx();
        const canvas = drawingCanvasRef.current;
        if (!ctx || !canvas) return;
        onDrawEnd(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear drawing canvas after committing
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
    
    const stamp = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const radgrad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 2);
      const { r, g, b } = hexToRgb(foregroundColor);
      const colorWithOpacity = `rgba(${r}, ${g}, ${b}, ${brushOpacity})`;
      const transparentColor = `rgba(${r}, ${g}, ${b}, 0)`;

      radgrad.addColorStop(0, colorWithOpacity);
      radgrad.addColorStop(Math.max(0, brushHardness), colorWithOpacity);
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
    
    const hitTest = (x: number, y: number): Layer | null => {
        // Iterate from top layer to bottom
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer.isVisible) continue;

            // Create an inverse transformation matrix to map the click coordinates
            // from canvas space to the layer's local space.
            const matrix = new DOMMatrix()
                .translate(layer.x, layer.y)
                .rotate(layer.rotation)
                .scale(layer.scaleX, layer.scaleY)
                .translate(-layer.width / 2, -layer.height / 2);
            
            const inverseMatrix = matrix.inverse();
            const localPoint = new DOMPoint(x, y).matrixTransform(inverseMatrix);

            // Check if the click is within the layer's bounding box
            if (localPoint.x >= 0 && localPoint.x < layer.width && localPoint.y >= 0 && localPoint.y < layer.height) {
                
                // For shape layers, a hit within the bounding box is enough.
                if (layer.type === 'shape') {
                    return layer;
                }

                // For pixel layers, check for non-transparent pixels.
                // Empty layers (imageData is null) cannot be moved.
                if (layer.type === 'pixel' && layer.imageData) {
                    const localX = Math.floor(localPoint.x);
                    const localY = Math.floor(localPoint.y);

                    // Calculate the index for the alpha channel in the ImageData array
                    const alphaIndex = (localY * layer.imageData.width + localX) * 4 + 3;
                    
                    // If the alpha value is greater than 0, it's a hit.
                    if (layer.imageData.data[alphaIndex] > 0) {
                        return layer;
                    }
                }
                
                // If it's an empty pixel layer or a transparent part of a pixel layer, continue checking layers below.
            }
        }
        return null; // No layer was hit
    }


    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isSpacebarDown || (activeTool === EditorTool.TRANSFORM && activeSubTool === 'transform')) return;

        const isDrawingTool = [EditorTool.PAINT, EditorTool.TYPE, EditorTool.SHAPES, EditorTool.SELECT].includes(activeTool);
        
        if (isBackground && isDrawingTool) {
            onAttemptEditBackgroundLayer?.();
            return;
        }
        if (isLocked) return;

        finalizeTextInput();
        const canvas = interactionCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        if (activeTool === EditorTool.TRANSFORM && activeSubTool === 'move') {
            const targetLayer = hitTest(x, y);
            if (targetLayer) {
                onMoveStart(targetLayer.id, e.clientX, e.clientY);
            }
            return;
        }

        if (selectionRect && isDrawingTool) {
            const { x: sx, y: sy, width: sw, height: sh } = selectionRect;
            if (x < sx || x >= sx + sw || y < sy || y >= sy + sh) {
                return;
            }
        }

        switch (activeTool) {
            case EditorTool.PAINT:
                isDrawing.current = true;
                lastPos.current = { x, y };
                const drawCtx = getDrawingCtx();
                if (drawCtx) {
                    drawCtx.save();
                    if (selectionRect) {
                        drawCtx.beginPath();
                        drawCtx.rect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
                        drawCtx.clip();
                    }
                    drawCtx.globalCompositeOperation = activeSubTool === 'eraser' ? 'destination-out' : 'source-over';
                    stamp(drawCtx, x, y);
                }
                break;
            case EditorTool.TYPE:
                setTextEdit({ x, y, value: '' });
                break;
            case EditorTool.SELECT:
            case EditorTool.SHAPES:
                isDrawing.current = true;
                shapeStartPos.current = { x, y };
                break;
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isSpacebarDown) return;
        if (moveSession) {
            onMoveUpdate(e.clientX, e.clientY);
            return;
        }
        if (isLocked) return;
        if (!isDrawing.current) return;
        
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        const drawCtx = getDrawingCtx();

        switch (activeTool) {
            case EditorTool.PAINT:
                if (!drawCtx || !lastPos.current) return;
                const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
                const angle = Math.atan2(y - lastPos.current.y, x - lastPos.current.x);
                for (let i = 0; i < dist; i += Math.max(1, brushSize / 20)) {
                    const currentX = lastPos.current.x + Math.cos(angle) * i;
                    const currentY = lastPos.current.y + Math.sin(angle) * i;
                    stamp(drawCtx, currentX, currentY);
                }
                stamp(drawCtx, x, y);
                lastPos.current = { x, y };
                break;
            case EditorTool.SELECT:
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
                // Shape preview logic would go here, likely on a separate interaction canvas
                break;
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (moveSession) {
            onMoveCommit(e.clientX, e.clientY);
            return;
        }
        if (isLocked || !isDrawing.current) return;

        const drawCtx = getDrawingCtx();
        isDrawing.current = false;
        
        if (drawCtx) {
             switch (activeTool) {
                case EditorTool.PAINT:
                    drawCtx.restore(); // Restore context to remove clipping
                    handleDrawEnd();
                    break;
                case EditorTool.SHAPES:
                    // FIX: Instead of rasterizing the shape, call onAddShapeLayer to create a new vector shape layer.
                     if (shapeStartPos.current) {
                        const rect = drawingCanvasRef.current!.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / zoom;
                        const y = (e.clientY - rect.top) / zoom;
                        const finalRect = {
                            x: Math.min(shapeStartPos.current.x, x),
                            y: Math.min(shapeStartPos.current.y, y),
                            width: Math.abs(x - shapeStartPos.current.x),
                            height: Math.abs(y - shapeStartPos.current.y),
                        };
                        if (finalRect.width > 2 && finalRect.height > 2) {
                            onAddShapeLayer(finalRect);
                        }
                    }
                    break;
                case EditorTool.SELECT:
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
      const canvas = interactionCanvasRef.current;
      if (!canvas) return;
      
      if (isSpacebarDown) {
        canvas.style.cursor = ''; return;
      }
      if (isLocked) {
        canvas.style.cursor = 'not-allowed'; return;
      }

      switch (activeTool) {
          case EditorTool.TRANSFORM:
              if (activeSubTool === 'move') {
                  const moveCursorSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg"><path d="M19.7529 12.2852L4.25293 2.28516L11.0029 18.2852L12.4249 13.1162L19.7529 12.2852Z"/></svg>`;
                  canvas.style.cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(moveCursorSVG)}') 4 2, auto`;
              } else {
                  canvas.style.cursor = 'default';
              }
              break;
          case EditorTool.SELECT:
          case EditorTool.SHAPES:
              canvas.style.cursor = 'crosshair'; break;
          case EditorTool.TYPE:
              canvas.style.cursor = 'text'; break;
          case EditorTool.PAINT:
              canvas.style.cursor = 'none'; break;
          default:
              canvas.style.cursor = 'default';
      }
    }, [activeTool, activeSubTool, isLocked, isSpacebarDown]);

    return (
      <div style={{ width, height }} className="absolute top-0 left-0">
        <canvas
            ref={drawingCanvasRef}
            width={width}
            height={height}
            className="absolute top-0 left-0 pointer-events-none"
        />
        <div
            ref={interactionCanvasRef}
            style={{ width, height }}
            className="absolute top-0 left-0 pointer-events-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => { 
                if (moveSession) onMoveCommit(e.clientX, e.clientY)
                if(isDrawing.current) handleMouseUp(e);
            }}
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
                    pointerEvents: 'auto'
                }}
                autoFocus
            />
        )}
      </div>
    );
});

export default Canvas;
