
import React from 'react';
import Icon from '../ui/Icon';

interface ActionBarProps {
    onCancel: () => void;
    onDone: () => void;
}

export const MoveActionBar: React.FC = () => {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20">
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="select-subject" />
                <span>Select subject</span>
                <Icon type="crown" className="text-purple-400" />
            </button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="image" />
                <span>Remove background</span>
            </button>
        </div>
    )
}

export const TransformActionBar: React.FC<ActionBarProps> = ({ onCancel, onDone }) => {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20">
            <button title="Reset Transform" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="undo" /></button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button title="Flip Horizontal" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="flip-horizontal" /></button>
            <button title="Flip Vertical" className="p-2 hover:bg-[#363636] rounded-md text-gray-300"><Icon type="flip-vertical" /></button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-[#363636] hover:bg-gray-700 text-gray-200 rounded-md">Cancel</button>
            <button onClick={onDone} className="px-5 py-2 text-sm font-medium bg-[#2F6FEF] hover:bg-blue-500 text-white rounded-md">Done</button>
        </div>
    );
};

export const CropActionBar: React.FC<ActionBarProps> = ({ onCancel, onDone }) => {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20">
             <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="generative" />
                <span>Generative expand</span>
            </button>
             <div className="w-px h-5 bg-gray-600/50"/>
            <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-[#363636] hover:bg-gray-700 text-gray-200 rounded-md">Cancel</button>
            <button onClick={onDone} className="px-5 py-2 text-sm font-medium bg-[#2F6FEF] hover:bg-blue-500 text-white rounded-md">Done</button>
        </div>
    )
}

export const AddImageActionBar: React.FC = () => {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl z-20">
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="add-image" />
                <span>Add image</span>
            </button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="generative" />
                <span>Generate image</span>
            </button>
        </div>
    )
}
