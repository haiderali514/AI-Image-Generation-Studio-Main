
/**
 * @file This component renders the main toolbar for the editor.
 */
import React from 'react';
import { EditorTool } from '../../types';
import Icon from '../ui/Icon';

interface ToolbarProps {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}

const toolIcons: Record<EditorTool, React.ReactNode> = {
  [EditorTool.BRUSH]: <Icon type="draw" />,
  [EditorTool.ERASER]: <Icon type="eraser" />,
  [EditorTool.FILL]: <Icon type="fill" />,
  [EditorTool.TEXT]: <Icon type="text" />,
  [EditorTool.SHAPES]: <Icon type="shapes" />,
};

/**
 * Renders the editor's toolbar.
 * Its responsibility is to display tool icons, highlight the active tool,
 * and allow the user to select a new tool.
 */
const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect }) => {
  return (
    <aside className="w-16 bg-[#252525] p-2 border-r border-black/20 flex flex-col items-center space-y-2 flex-shrink-0">
      {Object.values(EditorTool).map(tool => (
        <button
          key={tool}
          onClick={() => onToolSelect(tool)}
          className={`w-full h-12 flex items-center justify-center rounded-md transition-colors duration-150 ${
            activeTool === tool
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title={tool.charAt(0).toUpperCase() + tool.slice(1).toLowerCase().replace('_', ' ')}
        >
          {toolIcons[tool]}
        </button>
      ))}
    </aside>
  );
};

export default Toolbar;
