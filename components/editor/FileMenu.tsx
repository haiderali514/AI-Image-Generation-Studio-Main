
import React from 'react';
import Icon from '../ui/Icon';

interface FileMenuProps {
  onBackToHome: () => void;
  onNew: () => void;
  onSaveAs: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
}

const MenuItem: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  hasSubmenu?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, icon, shortcut, hasSubmenu, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between text-left px-4 py-2 text-sm rounded-md transition-colors ${
        disabled ? 'text-gray-500' : 'text-gray-200 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center space-x-3">
        {icon && <span className="w-5 h-5 flex items-center justify-center text-gray-400">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="flex items-center space-x-3 text-gray-500">
        {shortcut && <span className="text-xs">{shortcut}</span>}
        {hasSubmenu && <Icon type="chevron-right" />}
      </div>
    </button>
  );
};

const FileMenu: React.FC<FileMenuProps> = ({ onBackToHome, onNew, onSaveAs, onSaveProject, onOpenProject }) => {
  const subMenuItems = ['Document', 'Edit', 'Image', 'Layer', 'Select', 'View'];

  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-[#2D2D2D] border border-black/30 rounded-lg shadow-2xl p-2 flex flex-col space-y-1 z-50">
      <button
        onClick={onBackToHome}
        className="w-full text-left px-4 py-2.5 text-sm font-medium bg-[#363636] border border-gray-500/50 hover:border-blue-500 rounded-lg text-gray-200"
      >
        Back to home
      </button>
      <div className="pt-1 space-y-1">
        <MenuItem label="New..." onClick={onNew} shortcut="Ctrl+N" />
        <MenuItem label="Open Project..." onClick={onOpenProject} shortcut="Ctrl+O"/>
      </div>
       <hr className="border-t border-white/10 my-1" />
       <div className="space-y-1">
        <MenuItem label="Save Project" onClick={onSaveProject} shortcut="Ctrl+S" />
        <MenuItem label="Export as..." onClick={onSaveAs} shortcut="Ctrl+E" />
        <MenuItem label="Invite people..." disabled />
      </div>
      <hr className="border-t border-white/10 my-1" />
      <div className="space-y-1">
        {subMenuItems.map(item => (
          <MenuItem key={item} label={item} hasSubmenu disabled />
        ))}
      </div>
    </div>
  );
};

export default FileMenu;
