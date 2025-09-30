import React from 'react';
import { Tool } from '../types';
import Icon from './ui/Icon';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  onOpenCreateModal: () => void;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const baseClasses =
    'flex items-center w-full text-left p-3 rounded-lg transition-all duration-200 ease-in-out transform relative';
  const activeClasses = 'bg-gray-700 text-white';
  const inactiveClasses = 'text-gray-400 hover:bg-gray-700/50 hover:text-white';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      aria-label={label}
      title={label}
    >
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r-full"></div>}
      <span className="w-8 h-8 flex items-center justify-center">{icon}</span>
      <span className="font-medium ml-3 hidden group-hover:inline whitespace-nowrap">{label}</span>
    </button>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, onOpenCreateModal }) => {
  const mainNav = [
    { id: Tool.HOME, label: 'Home', icon: <Icon type="home" /> },
    { id: Tool.FILES, label: 'Files', icon: <Icon type="files" /> },
  ];

  return (
    <aside className="w-20 hover:w-64 bg-[#181818] p-4 flex flex-col border-r border-gray-800 shadow-xl transition-all duration-300 ease-in-out group overflow-hidden">
      <div className="mb-6 flex items-center space-x-3 px-1">
         <Icon type="logo" />
         <h1 className="text-xl font-semibold text-white hidden group-hover:inline whitespace-nowrap">Photoshop</h1>
      </div>
      
      <button 
        onClick={onOpenCreateModal}
        title="Create new file"
        className="w-full flex items-center p-3 mb-6 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors duration-200 shadow-md">
        <span className="w-8 h-8 flex items-center justify-center"><Icon type="plus" /></span>
        <span className="font-medium ml-3 hidden group-hover:inline whitespace-nowrap">Create</span>
      </button>

      <nav className="space-y-2">
        {mainNav.map((tool) => (
          <NavButton
            key={tool.id}
            label={tool.label}
            icon={tool.icon}
            isActive={activeTool === tool.id}
            onClick={() => setActiveTool(tool.id)}
          />
        ))}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-600">
        <p className="hidden group-hover:block whitespace-nowrap">&copy; 2024. Powered by Gemini.</p>
      </div>
    </aside>
  );
};

export default Sidebar;