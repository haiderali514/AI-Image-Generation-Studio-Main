
import React from 'react';
import { EditorTool } from '../../types';
import Icon from '../ui/Icon';

interface ToolbarProps {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}

const toolIcons: Record<EditorTool, React.ReactNode> = {
  [EditorTool.MOVE]: <Icon type="move" />,
  [EditorTool.SELECTION]: <Icon type="selection" />,
  [EditorTool.CROP]: <Icon type="crop" />,
  [EditorTool.TRANSFORM]: <Icon type="transform" />,
  [EditorTool.BRUSH]: <Icon type="draw" />,
  [EditorTool.ERASER]: <Icon type="eraser" />,
  [EditorTool.FILL]: <Icon type="fill" />,
  [EditorTool.TEXT]: <Icon type="text" />,
  [EditorTool.SHAPES]: <Icon type="shapes" />,
};

const getToolName = (tool: EditorTool) => tool.charAt(0).toUpperCase() + tool.slice(1).toLowerCase().replace('_', ' ');

const ToolButton: React.FC<{
  tool: EditorTool;
  isActive: boolean;
  onSelect: (tool: EditorTool) => void;
}> = ({ tool, isActive, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(tool)}
      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-150 ${
        isActive
          ? 'bg-[#2F6FEF]'
          : 'hover:bg-[#363636]'
      }`}
      title={getToolName(tool)}
    >
      {toolIcons[tool]}
    </button>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect }) => {
  const topTools: EditorTool[] = [
    EditorTool.MOVE, EditorTool.SELECTION, EditorTool.CROP, EditorTool.TRANSFORM
  ];
  const bottomTools: EditorTool[] = [
    EditorTool.BRUSH, EditorTool.ERASER, EditorTool.TEXT, EditorTool.SHAPES
  ];

  return (
    <aside className="w-16 bg-[#2D2D2D] p-2 border-r border-black/20 flex flex-col items-center flex-shrink-0 z-10">
      <div className="space-y-2">
        {topTools.map(tool => (
          <ToolButton key={tool} tool={tool} isActive={activeTool === tool} onSelect={onToolSelect} />
        ))}
        <div className="h-px w-8 bg-gray-600/50 my-2 mx-auto" />
        {bottomTools.map(tool => (
          <ToolButton key={tool} tool={tool} isActive={activeTool === tool} onSelect={onToolSelect} />
        ))}
      </div>
      <div className="mt-auto">
         <ToolButton tool={EditorTool.FILL} isActive={activeTool === EditorTool.FILL} onSelect={onToolSelect} />
      </div>
    </aside>
  );
};

export default Toolbar;