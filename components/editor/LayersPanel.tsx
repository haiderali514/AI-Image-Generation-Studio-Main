
import React, { useState, useRef, useEffect } from 'react';
import { Layer, BlendMode } from '../../types';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Input from '../ui/Input';

interface LayersPanelProps {
    layers: Layer[];
    activeLayerId: string | null;
    onSelectLayer: (id: string) => void;
    onAddLayer: () => void;
    onDeleteLayer: () => void;
    onUpdateLayerProps: (id: string, props: Partial<Layer>, action: string) => void;
    onUpdateLayerPropsPreview: (id: string, props: Partial<Layer>) => void;
    onDuplicateLayer: () => void;
    onMergeDown: () => void;
    onConvertBackground: () => void;
    onClose: () => void;
    height: number;
    onHeightChange: (height: number) => void;
}

const OpacitySlider: React.FC<{ 
    value: number; 
    onPreview: (value: number) => void;
    onCommit: (value: number) => void;
    disabled?: boolean; 
}> = ({ value, onPreview, onCommit, disabled }) => {
    const percentage = Math.round(value * 100);

    return (
        <div className="flex items-center space-x-2">
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onPreview(parseFloat(e.target.value))}
                onMouseUp={(e) => onCommit(parseFloat((e.target as HTMLInputElement).value))}
                onBlur={(e) => onCommit(parseFloat((e.target as HTMLInputElement).value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                disabled={disabled}
            />
            <div className="relative w-20">
                <Input
                    type="number"
                    value={percentage}
                    onChange={(e) => onPreview(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) / 100)}
                    onBlur={(e) => onCommit(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) / 100)}
                    className="pr-6 text-right"
                    disabled={disabled}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">%</span>
            </div>
        </div>
    );
};

const LayerItem: React.FC<{
    layer: Layer;
    isActive: boolean;
    onSelect: () => void;
    onUpdate: (props: Partial<Layer>, action: string) => void;
    onConvertBackground: () => void;
}> = ({ layer, isActive, onSelect, onUpdate, onConvertBackground }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(layer.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setName(layer.name);
    }, [layer.name]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNameBlur = () => {
        setIsEditing(false);
        if (layer.isBackground || layer.isLocked) return;
        if (name.trim() === '') {
            setName(layer.name);
        } else if (name !== layer.name) {
            onUpdate({ name }, 'Rename Layer');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') inputRef.current?.blur();
        else if (e.key === 'Escape') {
            setName(layer.name);
            setIsEditing(false);
        }
    };

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    };

    const handleConvert = (e: React.MouseEvent) => {
        e.stopPropagation();
        onConvertBackground();
        setIsMenuOpen(false);
    };

    const handleToggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ isLocked: !layer.isLocked }, layer.isLocked ? 'Unlock Layer' : 'Lock Layer');
        setIsMenuOpen(false);
    };

    return (
        <div
            onClick={onSelect}
            onDoubleClick={() => !layer.isBackground && !layer.isLocked && setIsEditing(true)}
            className={`flex items-center space-x-2 p-1.5 rounded-md cursor-pointer transition-colors ${isActive ? 'bg-[#2F6FEF]/40' : 'hover:bg-white/5'}`}
        >
            <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ isVisible: !layer.isVisible }, 'Toggle Layer Visibility'); }}
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
            {layer.isLocked && !layer.isBackground && (
                <Icon type="lock" className="text-gray-400 mr-1" />
            )}
            <div className="relative" ref={menuRef}>
                 <button 
                    onClick={handleMenuToggle}
                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-white/10"
                    title="More options"
                >
                    <Icon type="layer-options" />
                </button>
                {isMenuOpen && (
                    <div className="absolute z-10 right-0 mt-2 w-48 bg-[#363636] border border-black/30 rounded-md shadow-lg py-1">
                        {layer.isBackground ? (
                            <button
                                onClick={handleConvert}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600"
                            >
                                Convert to Normal Layer
                            </button>
                        ) : (
                             <button
                                onClick={handleToggleLock}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600"
                            >
                                {layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const LayersPanel: React.FC<LayersPanelProps> = (props) => {
    const { layers, activeLayerId, onSelectLayer, onAddLayer, onDeleteLayer, onUpdateLayerProps, onUpdateLayerPropsPreview, onDuplicateLayer, onMergeDown, onConvertBackground, onClose, height, onHeightChange } = props;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    
    const panelRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = handleRef.current;
        const panel = panelRef.current;
        if (!handle || !panel) return;
        const onMouseDown = (e_down: MouseEvent) => {
            e_down.preventDefault();
            const startY = e_down.clientY;
            const startHeight = panel.getBoundingClientRect().height;
            const onMouseMove = (e_move: MouseEvent) => {
                const dy = e_move.clientY - startY;
                onHeightChange(Math.max(150, startHeight + dy));
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        handle.addEventListener('mousedown', onMouseDown);
        return () => {
            if (handle) {
                handle.removeEventListener('mousedown', onMouseDown);
            }
        };
    }, [onHeightChange]);

    const reversedLayers = [...layers].reverse();
    
    const blendModeOptions: { value: BlendMode, label: string }[] = [
        { value: 'normal', label: 'Normal' }, { value: 'multiply', label: 'Multiply' }, { value: 'screen', label: 'Screen' },
        { value: 'overlay', label: 'Overlay' }, { value: 'darken', label: 'Darken' }, { value: 'lighten', label: 'Lighten' },
        { value: 'color-dodge', label: 'Color Dodge' }, { value: 'color-burn', label: 'Color Burn' }, { value: 'hard-light', label: 'Hard Light' },
        { value: 'soft-light', label: 'Soft Light' }, { value: 'difference', label: 'Difference' }, { value: 'exclusion', label: 'Exclusion' },
        { value: 'hue', label: 'Hue' }, { value: 'saturation', label: 'Saturation' }, { value: 'color', label: 'Color' }, { value: 'luminosity', label: 'Luminosity' }
    ];

    return (
        <div ref={panelRef} style={{ height: `${height}px` }} className="bg-[#2D2D2D] w-[300px] flex flex-col border-l border-black/20">
            <header className="h-10 px-2.5 flex justify-between items-center border-b border-black/20 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-base">Layers</h2>
                    <Icon type="info" className="text-gray-500"/>
                </div>
                <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10" title="Close Panel">
                    <Icon type="close" />
                </button>
            </header>
            
            <div className="px-2.5 py-2 flex items-center justify-around text-gray-400 border-b border-black/20">
                <button onClick={onAddLayer} title="Add Layer" className="p-1.5 hover:text-white rounded-md"><Icon type="plus-square" /></button>
                <button title="Add Layer Mask" className="p-1.5 hover:text-white rounded-md"><Icon type="add-element" /></button>
                <button title="Create Adjustment Layer" className="p-1.5 hover:text-white rounded-md"><Icon type="adjust" /></button>
                <button title="Create Group" className="p-1.5 hover:text-white rounded-md"><Icon type="layers" /></button>
                <button onClick={onDeleteLayer} disabled={layers.length <= 1 || !!activeLayer?.isBackground || !!activeLayer?.isLocked} className="p-1.5 hover:text-white rounded-md disabled:opacity-40" title="Delete layer"><Icon type="trash" /></button>
                <button title="More Options" className="p-1.5 hover:text-white rounded-md"><Icon type="menu" /></button>
            </div>

            <div className="px-2.5 py-2 space-y-3 border-b border-black/20">
                <Select
                    label="Blend"
                    options={blendModeOptions}
                    value={activeLayer?.blendMode || 'normal'}
                    onChange={(val) => activeLayer && onUpdateLayerProps(activeLayer.id, { blendMode: val as BlendMode }, 'Change Blend Mode')}
                    disabled={!activeLayer || !!activeLayer.isBackground || !!activeLayer.isLocked}
                />
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Opacity</label>
                    <OpacitySlider
                        value={activeLayer?.opacity ?? 1}
                        onPreview={(val) => activeLayer && onUpdateLayerPropsPreview(activeLayer.id, { opacity: val })}
                        onCommit={(val) => activeLayer && onUpdateLayerProps(activeLayer.id, { opacity: val }, 'Change Opacity')}
                        disabled={!activeLayer || !!activeLayer.isLocked}
                    />
                </div>
            </div>

            <div className="p-2.5 flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 p-2 space-y-1 overflow-y-auto bg-black/10 rounded-md">
                    {reversedLayers.map(layer => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            isActive={layer.id === activeLayerId}
                            onSelect={() => onSelectLayer(layer.id)}
                            onUpdate={(p, action) => onUpdateLayerProps(layer.id, p, action)}
                            onConvertBackground={onConvertBackground}
                        />
                    ))}
                </div>
            </div>
             <div ref={handleRef} className="h-1.5 w-full cursor-ns-resize bg-black/20 hover:bg-blue-600 transition-colors flex-shrink-0" />
        </div>
    );
};

export default LayersPanel;
