import React, { useState } from 'react';
import { EditorTool, AutoSelectType, TransformSubTool, BrushShape, PaintSubTool } from '../../types';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Input from '../ui/Input';
import AddImagePanel from '../panels/AddImagePanel';

interface PropertiesPanelProps {
    activeTool: EditorTool;
    activeSubTool: TransformSubTool;
    onSubToolChange: (subTool: TransformSubTool) => void;
    autoSelect: AutoSelectType;
    onAutoSelectChange: (type: AutoSelectType) => void;
    onClose: () => void;
    onImageAdded: (url: string) => void;
    brushSettings: { size: number; hardness: number; opacity: number; shape: BrushShape; };
    onBrushSettingsChange: React.Dispatch<React.SetStateAction<{ size: number; hardness: number; opacity: number; shape: BrushShape; }>>;
    activePaintSubTool: PaintSubTool;
    onPaintSubToolChange: (subTool: PaintSubTool) => void;
    transformProps?: {
        width: number;
        height: number;
        x: number;
        y: number;
        rotation: number;
        isAspectRatioLocked: boolean;
        onPropChange: (prop: string, value: number) => void;
        onLockToggle: () => void;
    }
}

const PaintToolPanel: React.FC<Pick<PropertiesPanelProps, 'brushSettings' | 'onBrushSettingsChange' | 'activePaintSubTool' | 'onPaintSubToolChange'>> = ({ brushSettings, onBrushSettingsChange, activePaintSubTool, onPaintSubToolChange }) => {
    const updateSetting = <K extends keyof typeof brushSettings>(key: K, value: (typeof brushSettings)[K]) => {
        onBrushSettingsChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-1 bg-[#1E1E1E] p-1 rounded-lg">
                <button
                    onClick={() => onPaintSubToolChange('brush')}
                    className={`flex-1 p-1.5 rounded-md flex items-center justify-center space-x-2 text-sm transition-colors ${activePaintSubTool === 'brush' ? 'bg-[#363636] text-white' : 'hover:bg-[#363636]/60 text-gray-300'}`}
                >
                    <Icon type="paint" />
                    <span>Brush</span>
                </button>
                <button
                    onClick={() => onPaintSubToolChange('eraser')}
                    className={`flex-1 p-1.5 rounded-md flex items-center justify-center space-x-2 text-sm transition-colors ${activePaintSubTool === 'eraser' ? 'bg-[#363636] text-white' : 'hover:bg-[#363636]/60 text-gray-300'}`}
                >
                    <Icon type="eraser" />
                    <span>Eraser</span>
                </button>
             </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Size</label>
                <div className="flex items-center space-x-2">
                    <input type="range" min="1" max="500" value={brushSettings.size} onChange={e => updateSetting('size', parseInt(e.target.value))} className="w-full accent-blue-500"/>
                    <span className="text-sm text-gray-300 w-12 text-center">{brushSettings.size}px</span>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hardness</label>
                <div className="flex items-center space-x-2">
                    <input type="range" min="0" max="1" step="0.01" value={brushSettings.hardness} onChange={e => updateSetting('hardness', parseFloat(e.target.value))} className="w-full accent-blue-500"/>
                    <span className="text-sm text-gray-300 w-12 text-center">{Math.round(brushSettings.hardness * 100)}%</span>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Opacity</label>
                <div className="flex items-center space-x-2">
                    <input type="range" min="0.01" max="1" step="0.01" value={brushSettings.opacity} onChange={e => updateSetting('opacity', parseFloat(e.target.value))} className="w-full accent-blue-500"/>
                    <span className="text-sm text-gray-300 w-12 text-center">{Math.round(brushSettings.opacity * 100)}%</span>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Shape</label>
                <div className="flex items-center space-x-2">
                    <button onClick={() => updateSetting('shape', 'round')} className={`p-2 rounded-md transition-colors ${brushSettings.shape === 'round' ? 'bg-blue-600 text-white' : 'bg-[#363636] hover:bg-gray-700 text-gray-300'}`} title="Round brush tip"><Icon type="brush-round" /></button>
                    <button onClick={() => updateSetting('shape', 'square')} className={`p-2 rounded-md transition-colors ${brushSettings.shape === 'square' ? 'bg-blue-600 text-white' : 'bg-[#363636] hover:bg-gray-700 text-gray-300'}`} title="Square brush tip"><Icon type="brush-square" /></button>
                </div>
            </div>
        </div>
    );
};

const getToolProperties = (tool: EditorTool): { title: string, panel: React.ComponentType<any> | null } => {
    switch (tool) {
        case EditorTool.TRANSFORM:
            return {
                title: "Size & position",
                panel: TransformToolPanel
            };
        case EditorTool.ADD_IMAGE:
            return {
                title: "Add image",
                panel: AddImagePanel
            };
        case EditorTool.PAINT:
            return {
                title: "Brush settings",
                panel: PaintToolPanel,
            };
        default:
            return { title: "Properties", panel: null };
    }
};

const MoveToolProperties: React.FC = () => {
    return (
        <div className="space-y-4">
            <div>
                <Select label="Auto-select" options={[{ value: 'Layer', label: 'Layer' }, { value: 'Group', label: 'Group' }]} value="Layer" onChange={() => {}} />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-400 mb-1">Align</label>
                 <div className="grid grid-cols-6 gap-1">
                    <button title="Align Left Edges" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-left-2" /></button>
                    <button title="Align Horizontal Centers" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-center-horizontal-2" /></button>
                    <button title="Align Right Edges" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-right-2" /></button>
                    <button title="Align Top Edges" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-top-2" /></button>
                    <button title="Align Vertical Centers" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-center-vertical-2" /></button>
                    <button title="Align Bottom Edges" className="p-2 rounded bg-[#363636] hover:bg-gray-700"><Icon type="align-bottom-2" /></button>
                 </div>
            </div>
            <button className="w-full flex items-center justify-between p-2 text-sm text-gray-300 hover:bg-[#363636] rounded-md">
                <span>Advanced settings</span>
                <Icon type="chevron-right" />
            </button>
        </div>
    );
};

const TransformToolProperties: React.FC<Pick<PropertiesPanelProps, 'transformProps'>> = ({ transformProps }) => {
    if (!transformProps) {
        return <div className="text-gray-500 text-sm p-4 text-center">Select a layer to transform.</div>;
    }
    const { width, height, x, y, rotation, isAspectRatioLocked, onPropChange, onLockToggle } = transformProps;

    return (
        <div className="space-y-3">
             <div className="flex items-center space-x-1 bg-[#1E1E1E] p-1 rounded-lg">
                <button className="flex-1 p-1.5 rounded-md flex items-center justify-center space-x-1 text-sm bg-[#363636]"><Icon type="transform" /><span>Freeform</span></button>
                <button className="flex-1 p-1.5 rounded-md flex items-center justify-center space-x-1 text-sm hover:bg-[#363636]" disabled><Icon type="selection" /><span>Warp</span></button>
             </div>

             <div className="flex items-center space-x-2">
                <Input label="Width" type="number" value={Math.round(width)} onChange={e => onPropChange('width', parseFloat(e.target.value))} />
                <button onClick={onLockToggle} className="p-2 self-end text-gray-400 hover:text-white transition-colors">
                    <Icon type={isAspectRatioLocked ? 'lock' : 'unlock'} />
                </button>
                <Input label="Height" type="number" value={Math.round(height)} onChange={e => onPropChange('height', parseFloat(e.target.value))} />
             </div>
             <div className="grid grid-cols-2 gap-x-2">
                <Input label="X" type="number" value={Math.round(x)} onChange={e => onPropChange('x', parseFloat(e.target.value))} />
                <Input label="Y" type="number" value={Math.round(y)} onChange={e => onPropChange('y', parseFloat(e.target.value))} />
             </div>
             <Input label="Rotation" type="number" value={rotation.toFixed(1)} onChange={e => onPropChange('rotation', parseFloat(e.target.value))} />
        </div>
    )
};

const CropToolProperties: React.FC = () => {
    return (
        <div className="space-y-4">
            <Select label="Units" options={[{value: 'Pixels', label: 'Pixels'}]} value="Pixels" onChange={() => {}}/>
            <div className="flex items-center space-x-2">
                <Input label="Width" type="number" value={1920} />
                <button className="p-2 self-end text-gray-400 hover:text-white transition-colors">
                    <Icon type="swap" />
                </button>
                <Input label="Height" type="number" value={1080} />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rotate</label>
                <div className="flex items-center space-x-2">
                    <input type="range" min="-45" max="45" value="0" className="w-full accent-blue-500" />
                    <Input type="number" value="0.0" className="w-24"/>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <button className="w-full p-2 text-sm bg-[#363636] rounded-md text-gray-300 hover:bg-gray-700">Straighten</button>
                <button className="w-full p-2 text-sm bg-[#363636] rounded-md text-gray-300 hover:bg-gray-700">Rotate</button>
             </div>
             <button className="w-full flex items-center justify-center p-2 space-x-2 bg-[#363636] rounded-md text-gray-300 hover:bg-gray-700">
                <Icon type="reset-colors" />
                <span>Reset</span>
             </button>
        </div>
    )
}

const TransformToolPanel: React.FC<PropertiesPanelProps> = (props) => {
    const { activeSubTool, onSubToolChange } = props;

    const subTools: { id: TransformSubTool, label: string, icon: 'move' | 'transform' | 'crop', properties: React.ReactNode }[] = [
        { id: 'move', label: 'Move', icon: 'move', properties: <MoveToolProperties /> },
        { id: 'transform', label: 'Transform', icon: 'transform', properties: <TransformToolProperties {...props} /> },
        { id: 'crop', label: 'Crop', icon: 'crop', properties: <CropToolProperties /> }
    ];

    return (
        <div className="space-y-2">
            {subTools.map(tool => (
                <div key={tool.id} className="bg-[#1E1E1E] rounded-lg">
                    <button
                        onClick={() => onSubToolChange(tool.id)}
                        className={`w-full p-2 flex items-center space-x-2 text-left transition-colors ${activeSubTool === tool.id ? 'bg-[#363636]' : 'hover:bg-[#363636]/60'}`}
                    >
                        <Icon type={tool.icon} />
                        <span className="flex-1 font-medium">{tool.label}</span>
                        <Icon type={activeSubTool === tool.id ? 'chevron-down' : 'chevron-right'} className="text-gray-500"/>
                    </button>
                    {activeSubTool === tool.id && (
                        <div className="p-3 border-t border-black/30">
                            {tool.properties}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
    const { activeTool, onClose } = props;
    const { title, panel: PanelComponent } = getToolProperties(activeTool);
    
    return (
        <aside className="w-72 bg-[#2D2D2D] p-4 border-r border-black/20 flex flex-col space-y-4 flex-shrink-0">
            <header className="flex justify-between items-center">
                <h2 className="font-semibold text-base">{title}</h2>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-md">
                    <Icon type="close" />
                </button>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {PanelComponent ? <PanelComponent {...props} /> : <div className="text-gray-500 p-4 text-center">Properties for this tool are coming soon.</div>}
            </div>
        </aside>
    );
};

export default PropertiesPanel;