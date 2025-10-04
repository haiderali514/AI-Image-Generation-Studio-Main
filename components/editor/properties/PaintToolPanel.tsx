
import React, { useState } from 'react';
import { BrushShape, PaintSubTool, AnySubTool } from '../../../types';
import Icon from '../../ui/Icon';
import CollapsibleSection from './CollapsibleSection';

interface PaintToolPanelProps {
    brushSettings: { size: number; hardness: number; opacity: number; shape: BrushShape; };
    onBrushSettingsChange: React.Dispatch<React.SetStateAction<{ size: number; hardness: number; opacity: number; shape: BrushShape; }>>;
    activeSubTool: AnySubTool;
    onSubToolChange: (subTool: AnySubTool) => void;
}

const PaintToolPanel: React.FC<PaintToolPanelProps> = ({ brushSettings, onBrushSettingsChange, activeSubTool, onSubToolChange }) => {
    const [openSection, setOpenSection] = useState<'tool' | 'settings' | null>('tool');
    
    const handleToggle = (section: 'tool' | 'settings') => {
        setOpenSection(prev => prev === section ? null : section);
    };
    
    const updateSetting = <K extends keyof typeof brushSettings>(key: K, value: (typeof brushSettings)[K]) => {
        onBrushSettingsChange(prev => ({ ...prev, [key]: value }));
    };

    const currentPaintSubTool = activeSubTool as PaintSubTool;

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Tool"
                icon={<Icon type={currentPaintSubTool === 'brush' ? 'paint' : 'eraser'} />} 
                isOpen={openSection === 'tool'}
                onToggle={() => handleToggle('tool')}
            >
                <div className="flex items-center space-x-1 bg-[#1E1E1E] p-1 rounded-lg">
                    <button
                        onClick={() => onSubToolChange('brush')}
                        className={`flex-1 p-1.5 rounded-md flex items-center justify-center space-x-2 text-sm transition-colors ${currentPaintSubTool === 'brush' ? 'bg-[#363636] text-white' : 'hover:bg-[#363636]/60 text-gray-300'}`}
                    >
                        <Icon type="paint" />
                        <span>Brush</span>
                    </button>
                    <button
                        onClick={() => onSubToolChange('eraser')}
                        className={`flex-1 p-1.5 rounded-md flex items-center justify-center space-x-2 text-sm transition-colors ${currentPaintSubTool === 'eraser' ? 'bg-[#363636] text-white' : 'hover:bg-[#363636]/60 text-gray-300'}`}
                    >
                        <Icon type="eraser" />
                        <span>Eraser</span>
                    </button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection 
                title="Brush Settings" 
                icon={<Icon type="adjust" />} 
                isOpen={openSection === 'settings'}
                onToggle={() => handleToggle('settings')}
            >
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