import React from 'react';
import { EditorTool, AnySubTool, TransformSession } from '../../../types';
import MoveContextualBar from './MoveContextualBar';
import TransformContextualBar from './TransformContextualBar';
import CropContextualBar from './CropContextualBar';

interface ContextualTaskbarProps {
    position: { top: number; left: number; visible: boolean; };
    activeTool: EditorTool;
    activeSubTool: AnySubTool;
    transformSession: TransformSession | null;
    onTransformConfirm: () => void;
    onTransformCancel: () => void;
    onRotateCW: () => void;
    onRotateCCW: () => void;
    onFlipHorizontal: () => void;
    onFlipVertical: () => void;
}

const ContextualTaskbar: React.FC<ContextualTaskbarProps> = (props) => {
    const { position, activeTool, activeSubTool, transformSession } = props;

    const renderContent = () => {
        if (transformSession) {
            return <TransformContextualBar 
                        onConfirm={props.onTransformConfirm} 
                        onCancel={props.onTransformCancel}
                        onRotateCW={props.onRotateCW}
                        onRotateCCW={props.onRotateCCW}
                        onFlipHorizontal={props.onFlipHorizontal}
                        onFlipVertical={props.onFlipVertical}
                    />;
        }

        if (activeTool === EditorTool.TRANSFORM) {
            switch (activeSubTool) {
                case 'move':
                    return <MoveContextualBar />;
                case 'crop':
                    return <CropContextualBar onConfirm={() => {}} onCancel={() => {}} />;
                default:
                    return null;
            }
        }
        return null;
    };

    const content = renderContent();
    if (!content || !position.visible) {
        return null;
    }

    return (
        <div 
            className="absolute bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20 transition-opacity"
            style={{ 
                top: `${position.top}px`, 
                left: `${position.left}px`,
                transform: 'translateX(-50%)',
                opacity: position.visible ? 1 : 0,
                pointerEvents: position.visible ? 'auto' : 'none',
            }}
        >
            {content}
        </div>
    );
};

export default ContextualTaskbar;
