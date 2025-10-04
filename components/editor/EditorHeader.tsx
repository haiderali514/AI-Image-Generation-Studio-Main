
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import FileMenu from './FileMenu';

interface EditorHeaderProps {
  documentName: string;
  onClose: () => void;
  onNew: () => void;
  onSaveAs: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
}

const ZoomDropdown: React.FC<{ zoom: number; onZoomChange: (zoom: number) => void }> = ({ zoom, onZoomChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-1.5 bg-[#363636] border border-transparent hover:border-gray-500 rounded-md flex items-center space-x-2"
            >
                <span>{Math.round(zoom * 100)}%</span>
                <Icon type="chevron-down" className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1.5 w-32 bg-[#363636] border border-black/50 rounded-md shadow-lg py-1 z-20">
                    {zoomLevels.map(level => (
                        <button
                            key={level}
                            onClick={() => { onZoomChange(level); setIsOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-600"
                        >
                            {level * 100}%
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const EditorHeader: React.FC<EditorHeaderProps> = (props) => {
  const { documentName, onClose, onNew, onSaveAs, onSaveProject, onOpenProject, canUndo, canRedo, onUndo, onRedo, zoom, onZoomChange, onResetView } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#2D2D2D] h-14 px-2 flex justify-between items-center border-b border-black/20 shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <div ref={menuRef} className="relative">
            <button onClick={() => setIsMenuOpen(p => !p)} className="p-2 rounded-md hover:bg-[#363636]" title="Menu">
                <Icon type="menu" />
            </button>
            {isMenuOpen && (
                <FileMenu
                    onBackToHome={onClose}
                    onNew={onNew}
                    onSaveAs={onSaveAs}
                    onSaveProject={onSaveProject}
                    onOpenProject={onOpenProject}
                />
            )}
        </div>
        <Icon type="ps-logo" />
        <div className="text-gray-400 text-sm truncate max-w-xs">{documentName}</div>
        <Icon type="cloud" className="text-gray-500" />
      </div>

      <div className="flex items-center space-x-3 text-gray-400">
        <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-md hover:bg-[#363636] disabled:opacity-40" title="Undo (Ctrl+Z)">
          <Icon type="undo" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-md hover:bg-[#363636] disabled:opacity-40" title="Redo (Ctrl+Shift+Z)">
          <Icon type="redo" />
        </button>
        <div className="w-px h-6 bg-gray-600/50 mx-1" />
        <button onClick={onResetView} className="p-1.5 rounded-md hover:bg-[#363636]" title="Reset View">
            <Icon type="fit-screen" />
        </button>
        <ZoomDropdown zoom={zoom} onZoomChange={onZoomChange} />
      </div>

      <div className="flex items-center space-x-1.5">
        <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-xs flex items-center space-x-1">
            <span>👑</span>
            <span>Upgrade</span>
        </button>
        <button className="px-3 py-1.5 text-sm font-semibold rounded-md hover:bg-[#363636]">
          Invite
        </button>
        <button onClick={onSaveAs} className="px-4 py-1.5 text-sm font-semibold rounded-md bg-[#2F6FEF] text-white hover:bg-blue-500">
          Export
        </button>
        <button className="p-2 rounded-md hover:bg-[#363636]" title="Share">
          <Icon type="share" />
        </button>
        <button className="p-2 rounded-md hover:bg-[#363636]" title="Comments">
          <Icon type="comment" />
        </button>
        <button className="p-2 rounded-md hover:bg-[#363636]" title="History">
          <Icon type="history" />
        </button>
        <button className="p-1 rounded-full" title="Profile">
          <Icon type="profile" />
        </button>
      </div>
    </header>
  );
};

export default EditorHeader;
