import React, { useRef, useEffect } from 'react';
import { Layer, TransformSession } from '../../types';

type HandleType = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'rotate';

interface TransformControlsProps {
    layer: Layer;
    zoom: number;
    onTransformStart: (layer: Layer, handle: string, e: React.MouseEvent) => void;
    onTransformUpdate: (newLayer: Layer) => void;
}

const getHandleCursor = (handle: HandleType, rotation: number) => {
    const baseCursors: { [key: string]: number } = {
        'ns-resize': 0, 'nesw-resize': 45, 'ew-resize': 90, 'nwse-resize': 135
    };
    const directions = ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'];
    
    const cursorForHandle: { [key in HandleType]?: string } = {
        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',
        'middle-left': 'ew-resize', 'middle-right': 'ew-resize',
        'top-left': 'nwse-resize', 'bottom-right': 'nwse-resize',
        'top-right': 'nesw-resize', 'bottom-left': 'nesw-resize',
        'rotate': 'crosshair'
    };
    
    const baseCursor = cursorForHandle[handle];
    if (!baseCursor) return 'default';
    if (baseCursor === 'crosshair') return 'crosshair';

    const baseAngle = baseCursors[baseCursor];
    const totalAngle = (baseAngle + rotation) % 180;
    const index = Math.round(totalAngle / 45);
    return directions[index];
};

// --- Helper Functions for Transformations ---

// Rotates a point around a center
const rotatePoint = (point: {x: number, y: number}, center: {x: number, y: number}, angle: number) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x;
    const ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;
    return { x: nx, y: ny };
};

const TransformControls: React.FC<TransformControlsProps> = ({ layer, zoom, onTransformStart, onTransformUpdate }) => {
    const handleSize = 8;
    const borderSize = 1;
    const rotationHandleOffset = 20;

    const dragInfo = useRef<{
        session: TransformSession,
        originalPoints: { tl: DOMPoint, tr: DOMPoint, bl: DOMPoint, br: DOMPoint },
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent, handle: HandleType) => {
        e.preventDefault();
        e.stopPropagation();
        onTransformStart(layer, handle, e);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current) return;

        const { session } = dragInfo.current;
        const { handle, originalLayer, startMouse } = session;
        const currentMouse = { x: e.clientX, y: e.clientY };

        const dx = (currentMouse.x - startMouse.x) / zoom;
        const dy = (currentMouse.y - startMouse.y) / zoom;
        
        let newLayer = { ...originalLayer };

        if (handle === 'rotate') {
            const center = { x: originalLayer.x, y: originalLayer.y };
            const startAngle = Math.atan2(startMouse.y / zoom - center.y, startMouse.x / zoom - center.x) * 180 / Math.PI;
            const currentAngle = Math.atan2(currentMouse.y / zoom - center.y, currentMouse.x / zoom - center.x) * 180 / Math.PI;
            newLayer.rotation = originalLayer.rotation + (currentAngle - startAngle);
        } else {
            const rad = originalLayer.rotation * Math.PI / 180;
            const cos = Math.cos(-rad);
            const sin = Math.sin(-rad);
            const rotatedDx = dx * cos - dy * sin;
            const rotatedDy = dx * sin + dy * cos;

            let newScaleX = originalLayer.scaleX;
            let newScaleY = originalLayer.scaleY;

            if (handle.includes('left')) newScaleX -= rotatedDx / originalLayer.width;
            if (handle.includes('right')) newScaleX += rotatedDx / originalLayer.width;
            if (handle.includes('top')) newScaleY -= rotatedDy / originalLayer.height;
            if (handle.includes('bottom')) newScaleY += rotatedDy / originalLayer.height;

            if (session.isAspectRatioLocked && (handle.includes('left') || handle.includes('right'))) {
                newScaleY = newScaleX * Math.sign(originalLayer.scaleX) * Math.sign(originalLayer.scaleY) * (originalLayer.height/originalLayer.width);
            } else if (session.isAspectRatioLocked && (handle.includes('top') || handle.includes('bottom'))) {
                newScaleX = newScaleY * Math.sign(originalLayer.scaleX) * Math.sign(originalLayer.scaleY) * (originalLayer.width/originalLayer.height);
            }

            const centerShiftX = (newScaleX - originalLayer.scaleX) * originalLayer.width / 2;
            const centerShiftY = (newScaleY - originalLayer.scaleY) * originalLayer.height / 2;
            
            let shiftX = 0;
            let shiftY = 0;

            if(handle.includes('left')) shiftX = -centerShiftX;
            if(handle.includes('right')) shiftX = centerShiftX;
            if(handle.includes('top')) shiftY = -centerShiftY;
            if(handle.includes('bottom')) shiftY = centerShiftY;

            const rotatedShift = rotatePoint({x: shiftX, y: shiftY}, {x: 0, y: 0}, originalLayer.rotation);

            newLayer.scaleX = newScaleX;
            newLayer.scaleY = newScaleY;
            newLayer.x = originalLayer.x + rotatedShift.x;
            newLayer.y = originalLayer.y + rotatedShift.y;
        }

        onTransformUpdate(newLayer);
    };
    
    const handleMouseUp = () => {
        dragInfo.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // Effect to manage global event listeners based on parent's session state
    useEffect(() => {
        if (onTransformStart) { // A bit of a hack to detect if this is the active control
            const handleGlobalDown = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                // If the click is not on one of our handles, commit the transform
                if (!target.closest('[data-transform-handle]')) {
                    // This logic is now in Editor.tsx when tool changes
                }
            }
            document.addEventListener('mousedown', handleGlobalDown);
            return () => document.removeEventListener('mousedown', handleGlobalDown);
        }
    }, [onTransformStart]);


    const transformStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${Math.abs(layer.width * layer.scaleX)}px`,
        height: `${Math.abs(layer.height * layer.scaleY)}px`,
        top: `${layer.y}px`,
        left: `${layer.x}px`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        pointerEvents: 'none',
        outline: `${borderSize / zoom}px solid #2F6FEF`,
        outlineOffset: `-${borderSize / zoom}px`,
    };

    const handleStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${handleSize / zoom}px`,
        height: `${handleSize / zoom}px`,
        backgroundColor: 'white',
        border: `${borderSize / zoom}px solid #2F6FEF`,
        borderRadius: '2px',
        pointerEvents: 'auto',
        transform: 'translate(-50%, -50%)',
    };

    const cornerHandleStyle = { ...handleStyle, borderRadius: '50%' };
    
    const handlePositions: Record<HandleType, React.CSSProperties> = {
        'top-left': { ...cornerHandleStyle, top: '0%', left: '0%' },
        'top-center': { ...handleStyle, top: '0%', left: '50%' },
        'top-right': { ...cornerHandleStyle, top: '0%', left: '100%' },
        'middle-left': { ...handleStyle, top: '50%', left: '0%' },
        'middle-right': { ...handleStyle, top: '50%', left: '100%' },
        'bottom-left': { ...cornerHandleStyle, top: '100%', left: '0%' },
        'bottom-center': { ...handleStyle, top: '100%', left: '50%' },
        'bottom-right': { ...cornerHandleStyle, top: '100%', left: '100%' },
        'rotate': { ...cornerHandleStyle, top: `${-rotationHandleOffset / zoom}px`, left: '50%' },
    };
    
    return (
        <div style={transformStyle}>
             {Object.entries(handlePositions).map(([pos, style]) => (
                 <div
                    key={pos}
                    data-transform-handle={pos}
                    onMouseDown={(e) => handleMouseDown(e, pos as HandleType)}
                    style={{
                        ...style,
                        cursor: getHandleCursor(pos as HandleType, layer.rotation),
                    }}
                 />
            ))}
            {/* Line to rotation handle */}
            <div
                style={{
                    position: 'absolute',
                    top: `${-rotationHandleOffset / zoom}px`,
                    left: '50%',
                    width: `${borderSize / zoom}px`,
                    height: `${rotationHandleOffset / zoom}px`,
                    backgroundColor: '#2F6FEF',
                    transform: 'translate(-50%, 0)',
                }}
            />
        </div>
    );
};

export default TransformControls;