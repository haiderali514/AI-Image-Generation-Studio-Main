import React, { useState, useRef, useEffect } from 'react';
import { Layer } from '../../types';
import Icon from '../ui/Icon';

interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onSelectLayer: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: () => void;
    onUpdateLayerProps: (id: string, props: Partial<Layer>) => void;
}

const LayerItem: React.FC<{
    layer: Layer;
    isActive: boolean;
    onSelect: () => void;
    onUpdate: (props: Partial<Layer>) => void;
}> = ({ layer, isActive, onSelect, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(layer.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleNameBlur = () => {
        setIsEditing(false);
        if (name.trim() === '') {
            setName(layer.name); // Revert if empty
        } else if (name !== layer.name) {
            onUpdate({ name });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setName(layer.name);
            setIsEditing(false);
        }
    };

    return (
        <div
            onClick={onSelect}
            onDoubleClick={() => setIsEditing(true)}
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-blue-600/30' : 'hover:bg-gray-700/50'}`}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ isVisible: !layer.isVisible }); }}
                className={`w-6 h-6 flex items-center justify-center rounded ${layer.isVisible ? 'text-gray-200' : 'text-gray-500'} hover:bg-gray-600`}
                title={layer.isVisible ? 'Hide layer' : 'Show layer'}
            >
              <Icon type={layer.isVisible ? 'eye' : 'eye-off'} />
            </button>
            <div className="w-12 h-10 bg-gray-900 border border-gray-600 rounded-sm flex items-center justify-center">
                <Icon type="image" className="text-gray-500" />
            </div>
            <div className="flex-1 truncate">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-gray-900/80 text-sm p-1 rounded border border-blue-500 outline-none"
                    />
                ) : (
                    <p className="text-sm text-gray-200 truncate">{layer.name}</p>
                )}
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ isLocked: !layer.isLocked }); }}
                className={`w-6 h-6 flex items-center justify-center rounded ${layer.isLocked ? 'text-gray-200' : 'text-gray-500'} hover:bg-gray-600`}
                title={layer.isLocked ? 'Unlock layer' : 'Lock layer'}
            >
               <Icon type={layer.isLocked ? 'lock' : 'unlock'} />
            </button>
        </div>
    );
};


const LayersPanel: React.FC<LayersPanelProps> = (props) => {
    const { layers, activeLayerId, onSelectLayer, onAddLayer, onDeleteLayer, onUpdateLayerProps } = props;

    // Create a reversed copy for rendering, so top layer is at the top
    const reversedLayers = [...layers].reverse();

    return (
        <div className="w-full bg-gray-800 rounded-lg shadow-lg border border-black/30 flex flex-col">
            <div className="bg-gray-900/50 p-2 rounded-t-lg">
                <h3 className="font-semibold text-sm uppercase text-gray-300">Layers</h3>
            </div>
            <div className="flex-1 p-2 space-y-1 overflow-y-auto min-h-[100px]">
                {reversedLayers.map(layer => (
                    <LayerItem
                        key={layer.id}
                        layer={layer}
                        isActive={layer.id === activeLayerId}
                        onSelect={() => onSelectLayer(layer.id)}
                        onUpdate={(p) => onUpdateLayerProps(layer.id, p)}
                    />
                ))}
            </div>
            <div className="flex items-center justify-end p-2 border-t border-black/20 bg-gray-900/50 rounded-b-lg space-x-1">
                <button onClick={onAddLayer} className="p-2 text-gray-300 hover:bg-gray-700 rounded-md" title="Add new layer">
                    <Icon type="plus-square" />
                </button>
                <button onClick={onDeleteLayer} disabled={layers.length <= 1} className="p-2 text-gray-300 hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" title="Delete layer">
                    <Icon type="trash" />
                </button>
            </div>
        </div>
    );
};

export default LayersPanel;
