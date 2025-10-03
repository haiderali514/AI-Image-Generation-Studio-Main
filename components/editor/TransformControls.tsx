

import React, { useRef, useEffect } from 'react';
import { Layer } from '../../types';

type HandleType = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'rotate';

interface TransformSession {
    layerId: string;
    initialLayerState: Layer;
    transform: DOMMatrix;
}

interface TransformControlsProps {
    layer: Layer;
    docWidth: number;
    docHeight: number;
    zoom: number;
    transformSession: TransformSession | null;
    onTransformStart: (layerId: string) => void;
    onTransformUpdate: (transform: DOMMatrix) => void;
}

const getHandleCursor = (handle: HandleType, rotation: number) => {
    const angle = rotation % 360;
    const baseCursors: Record<string, string> = {
        'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize',
        'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize',
        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',
        'middle-left': 'ew-resize', 'middle-right': 'ew-resize',
    };
    if (handle === 'rotate') return 'crosshair'; // Placeholder for custom rotation cursor
    
    // Rotate cursor based on element rotation
    const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    const getCursorForAngle = (base: 'ns' | 'ew' | 'nesw' | 'nwse', angle: number): string => {
        const offset = Math.round(angle / 45) % 8;
        const index = directions.indexOf(base.slice(0, 2));
        return directions[(index + offset + 8) % 8] + '-resize';
    };

    if(baseCursors[handle] === 'ns-resize') return getCursorForAngle('ns', angle);
    if(baseCursors[handle] === 'ew-resize') return getCursorForAngle('ew', angle);
    if(baseCursors[handle] === 'nesw-resize') return getCursorForAngle('nesw', angle);
    if(baseCursors[handle] === 'nwse-resize') return getCursorForAngle('nwse', angle);
    return 'default';
};

const TransformControls: React.FC<TransformControlsProps> = ({ layer, docWidth, docHeight, zoom, transformSession, onTransformStart, onTransformUpdate }) => {
    const handleSize = 8 / zoom;
    const borderSize = 1 / zoom;
    
    const dragInfo = useRef<{
        handle: HandleType,
        startX: number,
        startY: number,
        initialMatrix: DOMMatrix,
        center: { x: number, y: number }
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, handle: HandleType) => {
        e.preventDefault();
        e.stopPropagation();
        onTransformStart(layer.id);
        
        const initialMatrix = transformSession?.transform ?? new DOMMatrix().translate(layer.x, layer.y);
        
        dragInfo.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialMatrix,
            center: {
                x: layer.x + docWidth / 2,
                y: layer.y + docHeight / 2,
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current) return;
        
        const { handle, startX, startY, initialMatrix, center } = dragInfo.current;
        const dx = (e.clientX - startX) / zoom;
        const dy = (e.clientY - startY) / zoom;

        let newMatrix = new DOMMatrix(initialMatrix.toString());

        if (handle === 'rotate') {
             const startAngle = Math.atan2(startY / zoom - center.y, startX / zoom - center.x);
             const currentAngle = Math.atan2(e.clientY / zoom - center.y, e.clientX / zoom - center.x);
             const angleDelta = currentAngle - startAngle;

             newMatrix.translateSelf(center.x, center.y)
                      .rotateSelf(angleDelta * (180 / Math.PI))
                      .translateSelf(-center.x, -center.y);
        } else {
             // For simplicity, this example implements basic corner scaling + rotation together.
             // A full implementation would handle each handle type (edge, corner) differently.
             const scaleX = 1 + (dx / docWidth) * (handle.includes('right') ? 1 : -1) * 2;
             const scaleY = 1 + (dy / docHeight) * (handle.includes('bottom') ? 1 : -1) * 2;
             
             newMatrix.translateSelf(center.x, center.y)
                      .scaleSelf(scaleX, scaleY)
                      .translateSelf(-center.x, -center.y);
        }
        onTransformUpdate(newMatrix);
    };
    
    const handleMouseUp = () => {
        dragInfo.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        // Cleanup listeners if component unmounts during a drag
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const transformStyle: React.CSSProperties = {
        transform: transformSession ? transformSession.transform.toString() : `translate(${layer.x}px, ${layer.y}px)`,
        width: `${docWidth}px`,
        height: `${docHeight}px`,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
    };

    const handlePositions: Record<string, React.CSSProperties> = {
        'top-left': { top: 0, left: 0 },
        'top-center': { top: 0, left: '50%' },
        'top-right': { top: 0, right: 0 },
        'middle-left': { top: '50%', left: 0 },
        'middle-right': { top: '50%', right: 0 },
        'bottom-left': { bottom: 0, left: 0 },
        'bottom-center': { bottom: 0, left: '50%' },
        'bottom-right': { bottom: 0, right: 0 },
    };

    return (
        <div style={transformStyle}>
            {/* Bounding Box */}
            <div
                className="absolute inset-0"
                style={{
                    boxShadow: `0 0 0 ${borderSize}px #2F6FEF`,
                }}
            />
            {/* Handles */}
            {Object.entries(handlePositions).map(([pos, style]) => (
                 <div
                    key={pos}
                    onMouseDown={(e) => handleMouseDown(e, pos as HandleType)}
                    style={{
                        ...style,
                        position: 'absolute',
                        width: `${handleSize}px`,
                        height: `${handleSize}px`,
                        backgroundColor: 'white',
                        border: `${borderSize}px solid #2F6FEF`,
                        borderRadius: pos.includes('center') ? '2px' : '50%',
                        transform: `translate(-50%, -50%)`,
                        pointerEvents: 'auto',
                        cursor: getHandleCursor(pos as HandleType, 0),
                    }}
                 />
            ))}
        </div>
    );
};

export default TransformControls;