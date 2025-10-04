
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layer, TransformSession } from '../../types';

type HandleType = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'rotate';

interface TransformControlsProps {
    layer: Layer;
    zoom: number;
    pan: { x: number, y: number };
    onTransformStart: (layer: Layer, handle: string, e: React.MouseEvent, canvasMousePos: {x: number, y: number}) => void;
    onTransformUpdate: (newLayer: Layer) => void;
    onTransformCommit: () => void;
    onTransformCancel: () => void;
}

// Rotates a point around a center
const rotatePoint = (point: {x: number, y: number}, center: {x: number, y: number}, angle: number) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = (cos * (point.x - center.x)) + (sin * (point.y - center.y)) + center.x;
    const ny = (cos * (point.y - center.y)) - (sin * (point.x - center.x)) + center.y;
    return { x: nx, y: ny };
};

const getSvgCursor = (type: 'rotate' | 'scale', angle: number) => {
    const safeAngle = Math.round(angle);
    if (type === 'rotate') {
        const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${safeAngle} 16 16)"><path d="M19 8C20.6569 8 22 6.65685 22 5C22 3.34315 20.6569 2 19 2C17.3431 2 16 3.34315 16 5L16 10.125C16 10.5518 15.7518 10.932 15.342 11.0858L4.12201 15.4298C3.01579 15.8238 2.50262 17.0725 2.89662 18.1787C3.29063 19.2849 4.53934 19.7981 5.64556 19.4041L15.341 15.586C15.7508 15.4322 16 15.0519 16 14.6251V14.6251" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
        return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 16 16, auto`;
    }
    // Scale cursor
    const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${safeAngle} 16 16)"><path d="M17 15L28 4M28 4V11M28 4H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 17L4 28M4 28V21M4 28H11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 16 16, auto`;
};

const TransformControls: React.FC<TransformControlsProps> = ({ layer, zoom, pan, onTransformStart }) => {
    const [activeInteraction, setActiveInteraction] = useState<HandleType | null>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    
    // This effect detects what handle the mouse is over and sets the cursor
    useEffect(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        
        const handleMouseMove = (e: MouseEvent) => {
            const rect = controls.getBoundingClientRect();
            
            const boxCenterX = rect.left + rect.width / 2;
            const boxCenterY = rect.top + rect.height / 2;
            
            const localMouseX = e.clientX - boxCenterX;
            const localMouseY = e.clientY - boxCenterY;
            
            const rotatedMouse = rotatePoint({x: localMouseX, y: localMouseY}, {x:0,y:0}, -layer.rotation);
            
            const halfW = (layer.width * layer.scaleX * zoom) / 2;
            const halfH = (layer.height * layer.scaleY * zoom) / 2;
            
            const corners: Record<string, {x: number, y: number, angle: number}> = {
                'top-left': { x: -halfW, y: -halfH, angle: 135 + layer.rotation },
                'top-right': { x: halfW, y: -halfH, angle: 45 + layer.rotation },
                'bottom-left': { x: -halfW, y: halfH, angle: 225 + layer.rotation },
                'bottom-right': { x: halfW, y: halfH, angle: 315 + layer.rotation },
            };
            
            const ROTATION_THRESHOLD = 20;
            const SCALE_THRESHOLD = 8;

            let interaction: HandleType | null = null;
            let cursor = 'default';

            for (const [name, pos] of Object.entries(corners)) {
                const dist = Math.hypot(rotatedMouse.x - pos.x, rotatedMouse.y - pos.y);
                if (dist < ROTATION_THRESHOLD) {
                    if (dist < SCALE_THRESHOLD) {
                        interaction = name as HandleType;
                        cursor = getSvgCursor('scale', pos.angle);
                        break;
                    } else {
                        interaction = 'rotate';
                        const angleToCenter = Math.atan2(localMouseY, localMouseX) * 180 / Math.PI;
                        cursor = getSvgCursor('rotate', angleToCenter + 90);
                        break;
                    }
                }
            }
            
            if (!interaction) {
                const onTop = Math.abs(rotatedMouse.y - (-halfH)) < SCALE_THRESHOLD;
                const onBottom = Math.abs(rotatedMouse.y - halfH) < SCALE_THRESHOLD;
                const onLeft = Math.abs(rotatedMouse.x - (-halfW)) < SCALE_THRESHOLD;
                const onRight = Math.abs(rotatedMouse.x - halfW) < SCALE_THRESHOLD;
                const inX = rotatedMouse.x > -halfW && rotatedMouse.x < halfW;
                const inY = rotatedMouse.y > -halfH && rotatedMouse.y < halfH;
                
                if (onTop && inX) { interaction = 'top-center'; cursor = getSvgCursor('scale', 90 + layer.rotation); }
                else if (onBottom && inX) { interaction = 'bottom-center'; cursor = getSvgCursor('scale', 270 + layer.rotation); }
                else if (onLeft && inY) { interaction = 'middle-left'; cursor = getSvgCursor('scale', 180 + layer.rotation); }
                else if (onRight && inY) { interaction = 'middle-right'; cursor = getSvgCursor('scale', 0 + layer.rotation); }
            }

            setActiveInteraction(interaction);
            document.body.style.cursor = cursor;
        };

        const handleMouseLeave = () => {
             setActiveInteraction(null);
             document.body.style.cursor = 'default';
        };
        
        controls.addEventListener('mousemove', handleMouseMove);
        controls.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            controls.removeEventListener('mousemove', handleMouseMove);
            controls.removeEventListener('mouseleave', handleMouseLeave);
            // Don't reset cursor if a transform is active
            if (document.body.style.cursor !== 'default') {
               // document.body.style.cursor = 'default';
            }
        };
    }, [layer.rotation, layer.width, layer.height, layer.scaleX, layer.scaleY, zoom]);
    
    const handleWrapperMouseDown = (e: React.MouseEvent) => {
        // If the mouse is over a handle, start the transform and stop the event
        // This prevents the underlying canvas from starting a move operation.
        if (activeInteraction) {
            e.preventDefault();
            e.stopPropagation();
            const canvasMousePos = {
                x: (e.clientX - pan.x) / zoom,
                y: (e.clientY - pan.y) / zoom,
            };
            onTransformStart(layer, activeInteraction, e, canvasMousePos);
        }
        // If not over a handle, do nothing. The event will not be stopped,
        // allowing the underlying Canvas component to handle it (e.g., for moving).
    };

    const transformStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${Math.abs(layer.width * layer.scaleX)}px`,
        height: `${Math.abs(layer.height * layer.scaleY)}px`,
        top: `${layer.y}px`,
        left: `${layer.x}px`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        // This is key: if no interaction is active, let mouse events pass through
        // to the canvas below for the move tool.
        pointerEvents: activeInteraction ? 'auto' : 'none',
    };

    const outlineStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        outline: `${1 / zoom}px solid #2F6FEF`,
    }

    const handleStyle = (pos: 'corner' | 'edge'): React.CSSProperties => ({
        position: 'absolute',
        width: `${8 / zoom}px`,
        height: `${8 / zoom}px`,
        backgroundColor: 'white',
        border: `${1 / zoom}px solid #2F6FEF`,
        borderRadius: pos === 'corner' ? '50%' : '2px',
        transform: 'translate(-50%, -50%)',
        // We need pointer-events on the handles themselves to register hover/drag
        pointerEvents: 'auto',
    });
    
    const handles: {pos: React.CSSProperties, type: 'corner' | 'edge'}[] = [
        {pos: { top: '0%', left: '0%' }, type: 'corner'},
        {pos: { top: '0%', left: '50%' }, type: 'edge'},
        {pos: { top: '0%', left: '100%' }, type: 'corner'},
        {pos: { top: '50%', left: '0%' }, type: 'edge'},
        {pos: { top: '50%', left: '100%' }, type: 'edge'},
        {pos: { top: '100%', left: '0%' }, type: 'corner'},
        {pos: { top: '100%', left: '50%' }, type: 'edge'},
        {pos: { top: '100%', left: '100%' }, type: 'corner'},
    ];
    
    return (
        <div 
            ref={controlsRef}
            style={transformStyle}
            onMouseDown={handleWrapperMouseDown}
        >
            <div style={outlineStyle} />
             {handles.map((h, i) => (
                 <div key={i} style={{...handleStyle(h.type), ...h.pos}} />
            ))}
        </div>
    );
};

export default TransformControls;