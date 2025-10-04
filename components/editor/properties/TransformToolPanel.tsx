
import React from 'react';
import { TransformSubTool, AnySubTool } from '../../../types';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';
import Select from '../../ui/Select';
import Input from '../../ui/Input';

interface TransformToolPanelProps {
    transformProps?: any;
    activeSubTool: AnySubTool;
    onSubToolChange: (subTool: AnySubTool) => void;
}

// --- Sub-components for each section ---

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

const TransformToolProperties: React.FC<{ transformProps?: any }> = ({ transformProps }) => {
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
                <TransformToolProperties transformProps={transformProps} />
            </CollapsibleSection>
            <CollapsibleSection title="Crop" icon={<Icon type="crop" />} isOpen={activeSubTool === 'crop'} onToggle={() => handleToggle('crop')}>
                <CropToolProperties />
            </CollapsibleSection>
        </div>
    );
};

export default TransformToolPanel;