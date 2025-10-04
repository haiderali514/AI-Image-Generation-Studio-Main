

import React from 'react';
import { EditorTool, BrushShape, PaintSubTool } from '../../types';
import Icon from '../ui/Icon';

// Import all new panels
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

const getToolProperties = (tool: EditorTool): { title: string, panel: React.ComponentType<any> | null } => {
    switch (tool) {
        case EditorTool.TRANSFORM:
            return { title: "Size & position", panel: TransformToolPanel };
        case EditorTool.GENERATIVE:
            return { title: "Generative", panel: GenerativeToolPanel };
        case EditorTool.ADJUST:
            return { title: "Adjustments", panel: AdjustToolPanel };
        case EditorTool.SELECT:
            return { title: "Selection", panel: SelectToolPanel };
        case EditorTool.RETOUCH:
            return { title: "Retouch", panel: RetouchToolPanel };
        case EditorTool.QUICK_ACTIONS:
            return { title: "Quick Actions", panel: QuickActionsToolPanel };
        case EditorTool.EFFECTS:
            return { title: "Effects", panel: EffectsToolPanel };
        case EditorTool.PAINT:
            return { title: "Paint", panel: PaintToolPanel };
        case EditorTool.SHAPES:
            return { title: "Shapes", panel: ShapesToolPanel };
        case EditorTool.TYPE:
            return { title: "Type", panel: TypeToolPanel };
        case EditorTool.ADD_IMAGE:
            return { title: "Add image", panel: AddImageToolPanel };
        default:
            return { title: "Properties", panel: null };
    }
};

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