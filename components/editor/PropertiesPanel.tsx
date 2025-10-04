
import React from 'react';
import { EditorTool, Layer, BrushShape, AnySubTool } from '../../types';
import Icon from '../ui/Icon';
import TransformToolPanel from './properties/TransformToolPanel';
import GenerativeToolPanel from './properties/GenerativeToolPanel';
import AdjustToolPanel from './properties/AdjustToolPanel';
import SelectToolPanel from './properties/SelectToolPanel';
import RetouchToolPanel from './properties/RetouchToolPanel';
import QuickActionsToolPanel from './properties/QuickActionsToolPanel';
import EffectsToolPanel from './properties/EffectsToolPanel';
import PaintToolPanel from './properties/PaintToolPanel';
import ShapesToolPanel from './properties/ShapesToolPanel';
import TypeToolPanel from './properties/TypeToolPanel';
import AddImageToolPanel from './properties/AddImageToolPanel';

interface PropertiesPanelProps {
    activeTool: EditorTool;
    activeSubTool: AnySubTool;
    onSubToolChange: (subTool: AnySubTool) => void;
    transformProps?: {
        layer: Layer;
        onPropChange: (prop: keyof Layer, value: number) => void;
        onCommit: (prop: keyof Layer, value: number) => void;
    };
    onImageAdded: (url: string) => void;
    brushSettings: { size: number; hardness: number; opacity: number; shape: BrushShape; };
    onBrushSettingsChange: React.Dispatch<React.SetStateAction<{ size: number; hardness: number; opacity: number; shape: BrushShape; }>>;
    onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
    const { activeTool, onClose, ...rest } = props;

    const renderToolPanel = () => {
        switch (activeTool) {
            case EditorTool.TRANSFORM:
                return <TransformToolPanel {...rest} />;
            case EditorTool.GENERATIVE:
                return <GenerativeToolPanel />;
            case EditorTool.ADJUST:
                return <AdjustToolPanel />;
            case EditorTool.SELECT:
                return <SelectToolPanel />;
            case EditorTool.RETOUCH:
                return <RetouchToolPanel />;
            case EditorTool.QUICK_ACTIONS:
                return <QuickActionsToolPanel />;
            case EditorTool.EFFECTS:
                return <EffectsToolPanel />;
            case EditorTool.PAINT:
                return <PaintToolPanel {...rest} />;
            case EditorTool.SHAPES:
                return <ShapesToolPanel />;
            case EditorTool.TYPE:
                return <TypeToolPanel />;
            case EditorTool.ADD_IMAGE:
                return <AddImageToolPanel onImageAdded={props.onImageAdded} />;
            default:
                return <div className="p-4 text-center text-gray-500">Select a tool to see its properties.</div>;
        }
    };

    const getToolTitle = () => {
        switch (activeTool) {
            case EditorTool.TRANSFORM: return 'Size & position';
            case EditorTool.GENERATIVE: return 'Generative';
            case EditorTool.ADJUST: return 'Adjust';
            case EditorTool.SELECT: return 'Select';
            case EditorTool.RETOUCH: return 'Retouch';
            case EditorTool.QUICK_ACTIONS: return 'Quick Actions';
            case EditorTool.EFFECTS: return 'Effects';
            case EditorTool.PAINT: return 'Paint';
            case EditorTool.SHAPES: return 'Shapes';
            case EditorTool.TYPE: return 'Type';
            case EditorTool.ADD_IMAGE: return 'Add image';
            default: return 'Properties';
        }
    }

    return (
        <div className="bg-[#2D2D2D] w-[300px] flex flex-col border-r border-black/20">
            <header className="h-10 px-2.5 flex justify-between items-center border-b border-black/20 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <h2 className="font-semibold text-base">{getToolTitle()}</h2>
                </div>
                <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10" title="Close Panel">
                    <Icon type="close" />
                </button>
            </header>
            <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                {renderToolPanel()}
            </div>
        </div>
    );
};

export default PropertiesPanel;