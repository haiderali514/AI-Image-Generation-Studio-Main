

import React from 'react';
import { EditorTool } from '../../types';
import Icon from '../ui/Icon';

interface ToolbarProps {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}

const toolConfig: { tool: EditorTool, label: string, icon: React.ReactNode }[] = [
  { tool: EditorTool.TRANSFORM, label: 'Size & position', icon: <Icon type="transform" /> },
  { tool: EditorTool.GENERATIVE, label: 'Generative', icon: <Icon type="generative" /> },
  { tool: EditorTool.ADJUST, label: 'Adjust', icon: <Icon type="adjust" /> },
  { tool: EditorTool.SELECT, label: 'Select', icon: <Icon type="select" /> },
  { tool: EditorTool.RETOUCH, label: 'Retouch', icon: <Icon type="retouch" /> },
  { tool: EditorTool.QUICK_ACTIONS, label: 'Quick actions', icon: <Icon type="quick-actions" /> },
  { tool: EditorTool.EFFECTS, label: 'Effects', icon: <Icon type="effects" /> },
  { tool: EditorTool.PAINT, label: 'Paint', icon: <Icon type="paint" /> },
  { tool: EditorTool.SHAPES, label: 'Shapes', icon: <Icon type="shapes" /> },
  { tool: EditorTool.TYPE, label: 'Type', icon: <Icon type="type" /> },
  { tool: EditorTool.ADD_IMAGE, label: 'Add image', icon: <Icon type="add-image" /> },
];

const ToolButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-lg transition-all duration-150 text-white border-2 justify-center group-hover:justify-start ${
        isActive
          ? 'bg-[#2F6FEF] border-[#2F6FEF]'
          : 'border-transparent hover:border-[#363636] hover:bg-[#363636]'
      }`}
      title={label}
    >
      <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="font-medium text-sm ml-3 hidden group-hover:inline whitespace-nowrap">{label}</span>
    </button>
  );
};

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect }) => {
  return (
    <aside className="w-20 hover:w-60 bg-[#2D2D2D] p-3 border-r border-black/20 flex flex-col flex-shrink-0 z-10 transition-all duration-300 ease-in-out group overflow-y-auto">
      <div className="space-y-1">
        {toolConfig.map(item => (
          <ToolButton
            key={item.tool}
            label={item.label}
            icon={item.icon}
            isActive={activeTool === item.tool}
            onClick={() => onToolSelect(item.tool)}
          />
        ))}
      </div>
    </aside>
  );
};

export default Toolbar;