import React from 'react';
import Icon from '../../ui/Icon';

interface TransformContextualBarProps {
    onConfirm: () => void;
    onCancel: () => void;
    onRotateCCW: () => void;
    onRotateCW: () => void;
    onFlipHorizontal: () => void;
    onFlipVertical: () => void;
}

const TransformContextualBar: React.FC<TransformContextualBarProps> = ({ onConfirm, onCancel, onRotateCCW, onRotateCW, onFlipHorizontal, onFlipVertical }) => {
    return (
        <>
            <button onClick={onRotateCCW} title="Rotate Counter-Clockwise 90°" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="undo" /></button>
            <button onClick={onRotateCW} title="Rotate Clockwise 90°" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="redo" /></button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button onClick={onFlipHorizontal} title="Flip Horizontal" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="flip-horizontal" /></button>
            <button onClick={onFlipVertical} title="Flip Vertical" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="flip-vertical" /></button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-[#363636] hover:bg-gray-700 text-gray-200 rounded-md">Cancel</button>
            <button onClick={onConfirm} className="px-5 py-2 text-sm font-medium bg-[#2F6FEF] hover:bg-blue-500 text-white rounded-md">Done</button>
        </>
    );
};

export default TransformContextualBar;
