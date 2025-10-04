
import React from 'react';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { EditorTool, AnySubTool, Layer, BrushShape } from '../../types';

interface LeftSidebarProps {
    activeTool: EditorTool;
    onToolSelect: (tool: EditorTool) => void;
    foregroundColor: string;
    backgroundColor: string;
    onSetForegroundColor: (color: string) => void;
    onSetBackgroundColor: (color: string) => void;
    onSwapColors: () => void;
    onResetColors: () => void;

    // Properties Panel Props
    isPropertiesPanelOpen: boolean;
    togglePropertiesPanel: () => void;
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
}

const LeftSidebar: React.FC<LeftSidebarProps> = (props) => {
    return (
        <div className="flex h-full flex-shrink-0 z-10">
            <Toolbar
                activeTool={props.activeTool}
                onToolSelect={props.onToolSelect}
                foregroundColor={props.foregroundColor}
                backgroundColor={props.backgroundColor}
                onSetForegroundColor={props.onSetForegroundColor}
                onSetBackgroundColor={props.onSetBackgroundColor}
                onSwapColors={props.onSwapColors}
                onResetColors={props.onResetColors}
            />
            {props.isPropertiesPanelOpen && (
                <PropertiesPanel
                    activeTool={props.activeTool}
                    activeSubTool={props.activeSubTool}
                    onSubToolChange={props.onSubToolChange}
                    transformProps={props.transformProps}
                    onImageAdded={props.onImageAdded}
                    brushSettings={props.brushSettings}
                    onBrushSettingsChange={props.onBrushSettingsChange}
                    onClose={props.togglePropertiesPanel}
                />
            )}
        </div>
    );
};

export default LeftSidebar;