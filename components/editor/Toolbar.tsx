
/**
 * @file This component renders the main toolbar for the editor.
 */
import React, { useState, useRef, useEffect } from 'react';
import { EditorTool } from '../../types';
import Icon from '../ui/Icon';
import ColorPanel from './ColorPanel';

interface ToolbarProps {
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
  foregroundColor: string;
  backgroundColor: string;
  onSetForegroundColor: (color: string) => void;
  onSetBackgroundColor: (color: string) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

const toolIcons: Record<EditorTool, React.ReactNode> = {
  [EditorTool.MOVE]: <Icon type="move" />,
  [EditorTool.SELECTION]: <Icon type="selection" />,
  [EditorTool.BRUSH]: <Icon type="draw" />,
  [EditorTool.ERASER]: <Icon type="eraser" />,
  [EditorTool.FILL]: <Icon type="fill" />,
  [EditorTool.TEXT]: <Icon type="text" />,
  [EditorTool.SHAPES]: <Icon type="shapes" />,
};

const getToolName = (tool: EditorTool) => tool.charAt(0).toUpperCase() + tool.slice(1).toLowerCase().replace('_', ' ');

// A component for a group of tools that appear in a flyout menu
const ToolGroup: React.FC<{
  tools: EditorTool[];
  activeTool: EditorTool;
  onToolSelect: (tool: EditorTool) => void;
}> = ({ tools, activeTool, onToolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  const primaryTool = tools.find(t => t === activeTool) || tools[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tool: EditorTool) => {
    onToolSelect(tool);
    setIsOpen(false);
  };

  return (
    <div ref={groupRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 flex items-center justify-center rounded-md transition-colors duration-150 relative ${
          tools.includes(activeTool)
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
        title={getToolName(primaryTool)}
      >
        {toolIcons[primaryTool]}
        {/* Little triangle indicator */}
        <div className="absolute bottom-1 right-1 w-0 h-0 border-[3px] border-transparent border-b-current border-r-current" />
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 ml-2 bg-[#3a3a3a] rounded-md shadow-lg p-1 z-20 flex flex-col space-y-1">
          {tools.map(tool => (
            <button
              key={tool}
              onClick={() => handleSelect(tool)}
              className="w-full flex items-center px-3 py-2 text-left text-gray-200 hover:bg-blue-600 rounded-sm space-x-3 whitespace-nowrap"
              title={getToolName(tool)}
            >
              <div className="w-6 h-6">{toolIcons[tool]}</div>
              <span className="text-sm">{getToolName(tool)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


/**
 * Renders the editor's toolbar.
 * Its responsibility is to display tool icons, highlight the active tool,
 * and allow the user to select a new tool.
 */
const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { activeTool, onToolSelect } = props;
  const toolLayout: EditorTool[][] = [
    [EditorTool.MOVE],
    [EditorTool.SELECTION],
    [EditorTool.BRUSH],
    [EditorTool.ERASER],
    [EditorTool.FILL],
    [EditorTool.TEXT],
    [EditorTool.SHAPES],
  ];

  return (
    <aside className="w-16 bg-[#252525] p-2 border-r border-black/20 flex flex-col items-center flex-shrink-0 z-10">
      <div className="space-y-2">
        {toolLayout.map((toolGroup, index) => {
          if (toolGroup.length > 1) {
            return (
              <ToolGroup
                key={`group-${index}`}
                tools={toolGroup}
                activeTool={activeTool}
                onToolSelect={onToolSelect}
              />
            );
          } else {
            const tool = toolGroup[0];
            return (
              <button
                key={tool}
                onClick={() => onToolSelect(tool)}
                className={`w-full h-12 flex items-center justify-center rounded-md transition-colors duration-150 ${
                  activeTool === tool
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                title={getToolName(tool)}
              >
                {toolIcons[tool]}
              </button>
            );
          }
        })}
      </div>
      <div className="mt-auto mb-4">
        <ColorPanel
            foregroundColor={props.foregroundColor}
            backgroundColor={props.backgroundColor}
            onSetForegroundColor={props.onSetForegroundColor}
            onSetBackgroundColor={props.onSetBackgroundColor}
            onSwapColors={props.onSwapColors}
            onResetColors={props.onResetColors}
        />
      </div>
    </aside>
  );
};

export default Toolbar;
