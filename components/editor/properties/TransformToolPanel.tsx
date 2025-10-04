
import React, { useState } from 'react';
import { TransformSubTool, AnySubTool, Layer } from '../../../types';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';
import Select from '../../ui/Select';
import Input from '../../ui/Input';

interface TransformToolPanelProps {
    transformProps?: {
        layer: Layer;
        onPropChange: (prop: keyof Layer, value: number) => void;
        onCommit: (prop: keyof Layer, value: number) => void;
    };
    activeSubTool: AnySubTool;
    onSubToolChange: (subTool: AnySubTool) => void;
}

const MoveToolProperties: React.FC = () => (
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
        <div>
          <button className="w-full flex justify-between items-center text-left text-sm text-gray-300 hover:bg-[#363636]/60 p-2 rounded-md">
            <span>Advanced settings</span>
            <Icon type="chevron-right" />
          </button>
        </div>
    </div>
);

const TransformToolProperties: React.FC<{ transformProps?: TransformToolPanelProps['transformProps'] }> = ({ transformProps }) => {
    const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
    
    if (!transformProps) {
        return <div className="text-gray-500 text-sm p-4 text-center">Select a layer to transform.</div>;
    }
    const { layer, onPropChange, onCommit } = transformProps;
    
    const displayedWidth = Math.abs(layer.width * layer.scaleX);
    const displayedHeight = Math.abs(layer.height * layer.scaleY);
    const aspectRatio = (layer.width && layer.height) ? layer.width / layer.height : 1;

    const handleNumericChange = (prop: 'width' | 'height' | 'x' | 'y' | 'rotation', valueStr: string) => {
        const value = parseFloat(valueStr) || 0;
        
        if (prop === 'width') {
            const newScaleX = value / layer.width;
            onPropChange('scaleX', newScaleX);
            if (isAspectRatioLocked) onPropChange('scaleY', newScaleX / aspectRatio * Math.sign(layer.scaleY));
        } else if (prop === 'height') {
            const newScaleY = value / layer.height;
            onPropChange('scaleY', newScaleY);
            if (isAspectRatioLocked) onPropChange('scaleX', newScaleY * aspectRatio * Math.sign(layer.scaleX));
        } else {
            onPropChange(prop, value);
        }
    };

    const handleCommit = (prop: Parameters<typeof handleNumericChange>[0], value: string) => {
        // We only commit x, y, rotation from here for now. Scale is committed via controls.
        onCommit(prop, parseFloat(value) || 0);
    };

    return (
        <div className="space-y-3">
             <div className="flex items-center space-x-2">
                <Input label="W" type="number" value={Math.round(displayedWidth)} onChange={e => handleNumericChange('width', e.target.value)} />
                <button onClick={() => setIsAspectRatioLocked(p => !p)} className="p-2 self-end text-gray-400 hover:text-white transition-colors">
                    <Icon type={isAspectRatioLocked ? 'lock' : 'unlock'} />
                </button>
                <Input label="H" type="number" value={Math.round(displayedHeight)} onChange={e => handleNumericChange('height', e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-x-2">
                <Input label="X" type="number" value={Math.round(layer.x)} onChange={e => handleNumericChange('x', e.target.value)} onBlur={e => handleCommit('x', e.target.value)} />
                <Input label="Y" type="number" value={Math.round(layer.y)} onChange={e => handleNumericChange('y', e.target.value)} onBlur={e => handleCommit('y', e.target.value)} />
             </div>
             <Input label="Rotation °" type="number" value={layer.rotation.toFixed(1)} onChange={e => handleNumericChange('rotation', e.target.value)} onBlur={e => handleCommit('rotation', e.target.value)} />
        </div>
    )
};

const CropToolProperties: React.FC = () => (
    <div><p className="text-gray-500 text-sm">Crop controls are coming soon.</p></div>
);

const TransformToolPanel: React.FC<TransformToolPanelProps> = ({ transformProps, activeSubTool, onSubToolChange }) => {
    
    const handleToggle = (subTool: TransformSubTool) => {
        onSubToolChange(subTool);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection title="Move" icon={<Icon type="move" />} isOpen={activeSubTool === 'move'} onToggle={() => handleToggle('move')}>
                <MoveToolProperties />
            </CollapsibleSection>
            <CollapsibleSection title="Transform" icon={<Icon type="transform" />} isOpen={activeSubTool === 'transform'} onToggle={() => handleToggle('transform')}>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mode</label>
                        <div className="flex items-center space-x-1 bg-[#1E1E1E] p-1 rounded-lg">
                            <button className="flex-1 p-1.5 rounded-md text-sm bg-[#363636] text-white">Free Transform</button>
                            <button className="flex-1 p-1.5 rounded-md text-sm hover:bg-[#363636]/60 text-gray-300">Skew</button>
                            <button className="flex-1 p-1.5 rounded-md text-sm hover:bg-[#363636]/60 text-gray-300">Distort</button>
                            <button className="flex-1 p-1.5 rounded-md text-sm hover:bg-[#363636]/60 text-gray-300">Perspective</button>
                        </div>
                    </div>
                    <TransformToolProperties transformProps={transformProps} />
                </div>
            </CollapsibleSection>
            <CollapsibleSection title="Crop" icon={<Icon type="crop" />} isOpen={activeSubTool === 'crop'} onToggle={() => handleToggle('crop')}>
                <CropToolProperties />
            </CollapsibleSection>
        </div>
    );
};

export default TransformToolPanel;