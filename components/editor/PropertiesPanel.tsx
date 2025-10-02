

import React from 'react';
import { EditorTool, AutoSelectType } from '../../types';
import Icon from '../ui/Icon';
import Select from '../ui/Select';

interface PropertiesPanelProps {
    activeTool: EditorTool;
    autoSelect: AutoSelectType;
    onAutoSelectChange: (type: AutoSelectType) => void;
    onClose: () => void;
}

const MoveToolPanel: React.FC<Pick<PropertiesPanelProps, 'autoSelect' | 'onAutoSelectChange'>> = ({ autoSelect, onAutoSelectChange }) => {

    const alignButtons = [
        { icon: 'align-left-2', title: 'Align left edges' },
        { icon: 'align-center-horizontal-2', title: 'Align horizontal centers' },
        { icon: 'align-right-2', title: 'Align right edges' },
        { icon: 'align-top-2', title: 'Align top edges' },
        { icon: 'align-center-vertical-2', title: 'Align vertical centers' },
        { icon: 'align-bottom-2', title: 'Align bottom edges' },
    ] as const;

    return (
        <>
            <div className="p-3 bg-[#2F6FEF] rounded-md flex items-center space-x-3">
                <Icon type="move" className="text-white" />
                <span className="font-semibold text-white">Move</span>
            </div>
            <div className="space-y-4">
                <Select
                    label="Auto-select"
                    options={[{ value: 'Layer', label: 'Layer' }, { value: 'Group', label: 'Group' }]}
                    value={autoSelect}
                    onChange={(val) => onAutoSelectChange(val as AutoSelectType)}
                />

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Align</label>
                    <div className="grid grid-cols-6 gap-1">
                        {alignButtons.map(btn => (
                            <button key={btn.icon} title={btn.title} className="p-2 bg-[#363636] rounded-md text-gray-300 hover:bg-gray-700">
                                <Icon type={btn.icon} />
                            </button>
                        ))}
                    </div>
                </div>

                <button className="w-full text-left flex items-center space-x-2 text-gray-300">
                    <Icon type="chevron-down" className="w-4 h-4 transform -rotate-90" />
                    <span className="font-semibold">Advanced settings</span>
                </button>
            </div>
             <div className="border-t border-black/20 -mx-4"/>
             <div className="space-y-2">
                 <button className="w-full flex items-center p-2 space-x-3 rounded-md hover:bg-[#363636]">
                    <Icon type="transform" className="text-gray-400" />
                    <span>Transform</span>
                 </button>
                 <button className="w-full flex items-center p-2 space-x-3 rounded-md hover:bg-[#363636]">
                    <Icon type="crop" className="text-gray-400" />
                    <span>Crop</span>
                 </button>
             </div>
        </>
    )
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ activeTool, autoSelect, onAutoSelectChange, onClose }) => {
    
    const renderContent = () => {
        switch(activeTool) {
            case EditorTool.MOVE:
                return <MoveToolPanel autoSelect={autoSelect} onAutoSelectChange={onAutoSelectChange} />;
            // Add other tool panels here in the future
            default:
                return <div className="text-gray-500 p-4 text-center">Select a tool to see its properties.</div>;
        }
    }

    return (
        <aside className="w-72 bg-[#2D2D2D] p-4 border-r border-black/20 flex flex-col space-y-4 flex-shrink-0">
            <header className="flex justify-between items-center">
                <h2 className="font-semibold text-base">Size & position</h2>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-md">
                    <Icon type="close" />
                </button>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {renderContent()}
            </div>
        </aside>
    );
};

export default PropertiesPanel;