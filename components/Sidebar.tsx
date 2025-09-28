
import React from 'react';
import { Tool } from '../types';
import Icon from './ui/Icon';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const SidebarButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const baseClasses =
    'flex items-center w-full text-left p-3 rounded-lg transition-all duration-200 ease-in-out transform';
  const activeClasses = 'bg-indigo-600 text-white shadow-lg';
  const inactiveClasses = 'text-gray-300 hover:bg-gray-700 hover:text-white';
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool }) => {
  const tools = [
    { id: Tool.TEXT_TO_IMAGE, label: 'Text to Image', icon: <Icon type="text" /> },
    { id: Tool.DRAW_TO_IMAGE, label: 'Draw to Image', icon: <Icon type="draw" /> },
    { id: Tool.GENERATIVE_FILL, label: 'Generative Fill', icon: <Icon type="fill" /> },
    { id: Tool.REMOVE_BACKGROUND, label: 'Remove Background', icon: <Icon type="cut" /> },
  ];

  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700 shadow-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center">
         <Icon type="logo" /> <span className="ml-2">Gemini Studio</span>
        </h2>
      </div>
      <nav className="space-y-2">
        {tools.map((tool) => (
          <SidebarButton
            key={tool.id}
            label={tool.label}
            icon={tool.icon}
            isActive={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
          />
        ))}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-500">
        <p>&copy; 2024. Powered by Gemini.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
