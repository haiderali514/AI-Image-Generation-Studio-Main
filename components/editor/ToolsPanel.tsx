
import React from 'react';
import { EditorTool } from '../../types';

interface ToolsPanelProps {
    activeTool: EditorTool;
}

const PanelHeader: React.FC<{ title: string; }> = ({ title }) => (
    <div
        className="bg-gray-900/50 p-2 rounded-t-lg flex items-center"
    >
        <h3 className="font-semibold text-sm uppercase text-gray-300">{title}</h3>
    </div>
);

const ToolsPanel: React.FC<ToolsPanelProps> = ({ activeTool }) => {
    
    const getToolInfo = (): { title: string, description: string } => {
        switch (activeTool) {
            case EditorTool.MOVE:
                return { title: "Move Tool", description: "Pan the canvas, or click and drag a selection to move it." };
            case EditorTool.SELECT:
                return { title: "Selection Tool", description: "Click and drag to create a rectangular selection." };
            case EditorTool.PAINT:
                return { title: "Brush Tool", description: "Use the top toolbar to adjust brush size, hardness, and opacity." };
            case EditorTool.TYPE:
                return { title: "Text Tool", description: "Use the top toolbar to adjust font, size, and alignment." };
            case EditorTool.SHAPES:
                return { title: "Shape Tool", description: "Shape controls are coming soon." };
            default:
                return { title: "Properties", description: ""};
        }
    };
    
    const { title, description } = getToolInfo();

    return (
        <div
            className="w-full bg-gray-800 rounded-lg shadow-lg border border-black/30"
        >
            <PanelHeader title={title} />
            {description && <p className="p-3 text-sm text-gray-400">{description}</p>}
        </div>
    );
};

export default ToolsPanel;
