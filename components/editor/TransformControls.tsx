
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Layer } from '../../types';

type HandleType = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'rotate';

interface TransformControlsProps {
    layer: Layer;
    zoom: number;
    pan: { x: number, y: number };
    onTransformStart: (layer: Layer, handle: string, e: React.MouseEvent, canvasMousePos: {x: number, y: number}, cursor: string) => void;
}

// Rotates a point around a center
const rotatePoint = (point: {x: number, y: number}, center: {x: number, y: number}, angle: number) => {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = (cos * (point.x - center.x)) - (sin * (point.y - center.y)) + center.x;
    const ny = (sin * (point.x - center.x)) + (cos * (point.y - center.y)) + center.y;
    return { x: nx, y: ny };
};

const getSvgCursor = (type: 'rotate' | 'scale-nesw' | 'scale-nwse' | 'scale-ns' | 'scale-ew', angle: number) => {
    const safeAngle = Math.round(angle);
    let svgPath = '';
    
    switch (type) {
        case 'rotate':
            svgPath = '<path d="M19 8C20.6569 8 22 6.65685 22 5C22 3.34315 20.6569 2 19 2C17.3431 2 16 3.34315 16 5L16 10.125C16 10.5518 15.7518 10.932 15.342 11.0858L4.12201 15.4298C3.01579 15.8238 2.50262 17.0725 2.89662 18.1787C3.29063 19.2849 4.53934 19.7981 5.64556 19.4041L15.341 15.586C15.7508 15.4322 16 15.0519 16 14.6251V14.6251" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            break;
        case 'scale-nesw': // top-right, bottom-left
            svgPath = '<path d="M17 15L28 4M28 4V11M28 4H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 17L4 28M4 28V21M4 28H11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            break;
        case 'scale-nwse': // top-left, bottom-right
            svgPath = '<path d="M15 15L4 4M4 4V11M4 4H11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 17L28 28M28 28V21M28 28H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            break;
        case 'scale-ns': // top-center, bottom-center
            svgPath = '<path d="M16 4V28M12 8L16 4L20 8M12 24L16 28L20 24" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            break;
        case 'scale-ew': // middle-left, middle-right
            svgPath = '<path d="M4 16H28M8 12L4 16L8 20M24 12L28 16L24 20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            break;
    }

    const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${safeAngle} 16 16)">${svgPath}</g><circle cx="16" cy="16" r="2" fill="black" /><circle cx="16" cy="16" r="1" fill="white" /></svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 16 16, auto`;
};


const TransformControls: React.FC<TransformControlsProps> = ({ layer, zoom, pan, onTransformStart }) => {
    const controlsRef = useRef<HTMLDivElement>(null);
    
    const cursors = useMemo(() => {
        return {
            'top-left': getSvgCursor('scale-nwse', layer.rotation),
            'top-center': getSvgCursor('scale-ns', layer.rotation),
            'top-right': getSvgCursor('scale-nesw', layer.rotation),
            'middle-left': getSvgCursor('scale-ew', layer.rotation),
            'middle-right': getSvgCursor('scale-ew', layer.rotation),
            'bottom-left': getSvgCursor('scale-nesw', layer.rotation),
            'bottom-center': getSvgCursor('scale-ns', layer.rotation),
            'bottom-right': getSvgCursor('scale-nwse', layer.rotation),
            'rotate': getSvgCursor('rotate', layer.rotation),
        };
    }, [layer.rotation]);

    const handleMouseDown = (e: React.MouseEvent, handle: HandleType) => {
        e.preventDefault();
        e.stopPropagation();
        
        // This calculates the mouse position relative to the canvas (top-left 0,0)
        const canvasMousePos = {
            x: (e.clientX - pan.x) / zoom,
            y: (e.clientY - pan.y) / zoom
        };
        const cursor = cursors[handle as keyof typeof cursors] || 'default';
        onTransformStart(layer, handle, e, canvasMousePos, cursor);
    };

    const transformStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${Math.abs(layer.width * layer.scaleX)}px`,
        height: `${Math.abs(layer.height * layer.scaleY)}px`,
        top: `${layer.y}px`,
        left: `${layer.x}px`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        // This is crucial to let clicks inside the box pass through to the canvas for moving
        pointerEvents: 'none', 
    };

    const outlineStyle: React.CSSProperties = {
        position: 'absolute',
        inset: -2 / zoom,
        outline: `${1 / zoom}px solid #2F6FEF`,
        // This MUST be none, otherwise it blocks the move tool's hit test
        pointerEvents: 'none',
    };

    const handleSize = 8 / zoom;

    const getHandleStyle = (top: string, left: string, type: 'corner' | 'edge' = 'corner'): React.CSSProperties => ({
        position: 'absolute',
        top,
        left,
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: 'white',
        border: `${1 / zoom}px solid #2F6FEF`,
        borderRadius: type === 'corner' ? '50%' : '0',
        transform: 'translate(-50%, -50%)',
        // This lets this specific element capture mouse events
        pointerEvents: 'auto',
    });

    const handles: { name: HandleType, style: React.CSSProperties, type: 'corner'|'edge' }[] = [
        { name: 'top-left', style: getHandleStyle('0%', '0%', 'corner'), type: 'corner' },
        { name: 'top-center', style: getHandleStyle('0%', '50%', 'edge'), type: 'edge' },
        { name: 'top-right', style: getHandleStyle('0%', '100%', 'corner'), type: 'corner' },
        { name: 'middle-left', style: getHandleStyle('50%', '0%', 'edge'), type: 'edge' },
        { name: 'middle-right', style: getHandleStyle('50%', '100%', 'edge'), type: 'edge' },
        { name: 'bottom-left', style: getHandleStyle('100%', '0%', 'corner'), type: 'corner' },
        { name: 'bottom-center', style: getHandleStyle('100%', '50%', 'edge'), type: 'edge' },
        { name: 'bottom-right', style: getHandleStyle('100%', '100%', 'corner'), type: 'corner' },
    ];
    
    return (
        <div 
            id="transform-controls-wrapper"
            ref={controlsRef}
            style={transformStyle}
        >
            <div style={outlineStyle} />
            {handles.map(({ name, style, type }) => {
                const isCorner = type === 'corner';
                const rotationHandleSize = handleSize * 4; // Make the rotation area larger
                const rotationAreaStyle: React.CSSProperties = {
                    position: 'absolute',
                    top: style.top,
                    left: style.left,
                    width: `${rotationHandleSize}px`,
                    height: `${rotationHandleSize}px`,
                    transform: 'translate(-50%, -50%)',
                    cursor: cursors['rotate'],
                    borderRadius: '50%',
                    pointerEvents: 'auto',
                }
                return (
                    <React.Fragment key={name}>
                        {isCorner && (
                           <div style={rotationAreaStyle} onMouseDown={e => handleMouseDown(e, 'rotate')}/>
                        )}
                        <div
                            style={{ ...style, cursor: cursors[name as keyof typeof cursors] }}
                            onMouseDown={e => handleMouseDown(e, name)}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default TransformControls;
