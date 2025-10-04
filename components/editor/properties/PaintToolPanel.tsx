
import React from 'react';
import { BrushShape, PaintSubTool } from '../../../types';
import Icon from '../../ui/Icon';
import CollapsibleSection from './CollapsibleSection';

interface PaintToolPanelProps {
    brushSettings: { size: number; hardness: number; opacity: number; shape: BrushShape; };
    onBrushSettingsChange: React.Dispatch<React.SetStateAction<{ size: number; hardness: number; opacity: number; shape: BrushShape; }>>;
    activePaintSubTool: PaintSubTool;
    onPaintSubToolChange: (subTool: PaintSubTool) => void;
}

const PaintToolPanel: React.FC<PaintToolPanelProps> = ({ brushSettings, onBrushSettingsChange, activePaintSubTool, onPaintSubToolChange }) => {
    const updateSetting = <K extends keyof typeof brushSettings>(key: K, value: (typeof brushSettings)[K]) => {
        onBrushSettingsChange(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title={activePaintSubTool === 'brush' ? 'Brush' : 'Eraser'} 
                icon={<Icon type={activePaintSubTool === 'brush' ? 'paint' : 'eraser'} />} 
                defaultOpen
            >
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
            </CollapsibleSection>

            <CollapsibleSection title="Brush Settings" icon={<Icon type="adjust" />} defaultOpen>
                 <div className="space-y-4">
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
            </CollapsibleSection>
        </div>
    );
};

export default PaintToolPanel;
