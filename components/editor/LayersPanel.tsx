
import React, { useState, useRef, useEffect } from 'react';
import { Layer, BlendMode } from '../../types';
import Icon from '../ui/Icon';
import Select from '../ui/Select';

interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onSelectLayer: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: () => void;
    onUpdateLayerProps: (id: string, props: Partial<Layer>) => void;
    onDuplicateLayer: () => void;
    onMergeDown: () => void;
    onConvertBackground: () => void;
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

    useEffect(() => {
        // Update local name state if layer name prop changes from parent
        setName(layer.name);
    }, [layer.name]);

    const handleNameBlur = () => {
        setIsEditing(false);
        if (layer.isBackground) return; // Cannot rename background
        if (name.trim() === '') {
            setName(layer.name); // Revert if empty
        } else if (name !== layer.name) {
            onUpdate({ name });
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') inputRef.current?.blur();
        else if (e.key === 'Escape') {
            setName(layer.name);
            setIsEditing(false);
        }
    };

    return (
        <div
            onClick={onSelect}
            onDoubleClick={() => !layer.isBackground && setIsEditing(true)}
            className={`flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#2F6FEF]/40' : 'hover:bg-white/5'}`}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ isVisible: !layer.isVisible }); }}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={layer.isBackground ? "Background layer cannot be hidden" : (layer.isVisible ? 'Hide layer' : 'Show layer')}
                disabled={layer.isBackground}
            >
              <Icon type={layer.isVisible ? 'eye' : 'eye-off'} />
            </button>
            <div className="w-12 h-10 bg-black/20 border border-black/30 rounded-sm flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'repeating-conic-gradient(#555 0 25%, transparent 0 50%)', backgroundSize: '10px 10px' }}>
                {layer.thumbnail && <img src={layer.thumbnail} alt={`${layer.name} thumbnail`} className="max-w-full max-h-full object-contain" />}
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
                        className="w-full bg-transparent text-sm p-1 rounded border border-blue-500 outline-none"
                    />
                ) : (
                    <p className={`text-sm truncate ${layer.isBackground ? 'italic text-gray-300' : 'text-gray-200'}`}>{layer.name}</p>
                )}
            </div>
             <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ isLocked: !layer.isLocked }); }}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={layer.isBackground ? "Background layer is always locked" : (layer.isLocked ? 'Unlock layer' : 'Lock layer')}
                disabled={layer.isBackground}
            >
              <Icon type={layer.isLocked ? 'lock' : 'unlock'} />
            </button>
        </div>
    );
};

const LayersPanel: React.FC<LayersPanelProps> = (props) => {
    const { layers, activeLayerId, onSelectLayer, onAddLayer, onDeleteLayer, onUpdateLayerProps, onDuplicateLayer, onMergeDown, onConvertBackground } = props;
    const activeLayer = layers.find(l => l.id === activeLayerId);

    const blendModeOptions: {value: BlendMode, label: string}[] = [
        {value: 'normal', label: 'Normal'}, {value: 'multiply', label: 'Multiply'}, {value: 'screen', label: 'Screen'},
        {value: 'overlay', label: 'Overlay'}, {value: 'darken', label: 'Darken'}, {value: 'lighten', label: 'Lighten'},
        {value: 'color-dodge', label: 'Color Dodge'}, {value: 'color-burn', label: 'Color Burn'}, {value: 'hard-light', label: 'Hard Light'},
        {value: 'soft-light', label: 'Soft Light'}, {value: 'difference', label: 'Difference'}, {value: 'exclusion', label: 'Exclusion'},
        {value: 'hue', label: 'Hue'}, {value: 'saturation', label: 'Saturation'}, {value: 'color', label: 'Color'}, {value: 'luminosity', label: 'Luminosity'}
    ];

    const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (activeLayer) {
            onUpdateLayerProps(activeLayer.id, { opacity: parseFloat(e.target.value) });
        }
    };

    const handleBlendModeChange = (val: string) => {
        if (activeLayer) {
            onUpdateLayerProps(activeLayer.id, { blendMode: val as BlendMode });
        }
    }

    const reversedLayers = [...layers].reverse();
    const activeLayerIndex = activeLayerId ? reversedLayers.findIndex(l => l.id === activeLayerId) : -1;
    const canMergeDown = activeLayerIndex < reversedLayers.length - 1;


    return (
        <aside className="w-[300px] bg-[#2D2D2D] flex flex-col border-l border-black/20">
            <header className="h-14 px-4 flex justify-between items-center border-b border-black/20 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-base">Layers</h2>
                    <Icon type="info" className="text-gray-500"/>
                </div>
                <div className="flex items-center text-gray-400">
                    <button className="p-2 hover:text-white rounded-md"><Icon type="layers" /></button>
                </div>
            </header>
            <div className="p-2 flex flex-col flex-1 overflow-hidden">
                <div className="p-2 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Blend" options={blendModeOptions} value={activeLayer?.blendMode ?? 'normal'} onChange={handleBlendModeChange} disabled={!activeLayer || !!activeLayer.isBackground}/>
                        <div className="relative">
                            <label className={`block text-xs font-medium mb-1 ${!activeLayer || activeLayer.isBackground ? 'text-gray-500' : 'text-gray-400'}`}>Opacity</label>
                            <input
                                type="number"
                                value={activeLayer ? Math.round(activeLayer.opacity * 100) : 100}
                                onChange={e => {
                                    if(activeLayer) {
                                        let val = parseInt(e.target.value) || 0;
                                        val = Math.max(0, Math.min(val, 100));
                                        onUpdateLayerProps(activeLayer.id, { opacity: val / 100 });
                                    }
                                }}
                                className="w-full p-2 bg-[#1E1E1E] border border-gray-700 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed disabled:text-gray-500"
                                disabled={!activeLayer || !!activeLayer.isBackground}
                            />
                        </div>
                    </div>
                </div>
                
                {activeLayer?.isBackground && (
                    <div className="px-2 pb-2">
                        <div className="p-3 bg-black/20 rounded-md text-xs text-gray-400 space-y-3">
                            <p>The Background layer is special. You can't move it, hide it, or change its blending options. To get full access, convert it to a normal layer.</p>
                            <button onClick={onConvertBackground} className="w-full text-center text-sm py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-semibold">
                                Convert to Layer
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 p-2 space-y-1 overflow-y-auto bg-black/10 rounded-md">
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
                 <div className="flex items-center justify-end p-2 mt-2 bg-black/10 rounded-md space-x-1 text-gray-400">
                    <button onClick={onDuplicateLayer} className="p-1.5 hover:text-white rounded-md" title="Duplicate Layer">
                       <Icon type="add-element" />
                    </button>
                    <button onClick={onMergeDown} disabled={!canMergeDown} className="p-1.5 hover:text-white rounded-md disabled:opacity-40" title="Merge Down">
                       <Icon type="layers" />
                    </button>
                    <div className="flex-1" />
                    <button onClick={onAddLayer} className="p-1.5 hover:text-white rounded-md" title="Add new layer">
                        <Icon type="plus-square" />
                    </button>
                    <button onClick={onDeleteLayer} disabled={layers.length <= 1 || !!activeLayer?.isBackground} className="p-1.5 hover:text-white rounded-md disabled:opacity-40" title="Delete layer">
                        <Icon type="trash" />
                    </button>
                 </div>
            </div>
        </aside>
    );
};

export default LayersPanel;
