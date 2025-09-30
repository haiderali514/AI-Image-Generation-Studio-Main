import React from 'react';
import Icon from '../ui/Icon';

interface EditorHeaderProps {
  documentName: string;
  onClose: () => void;
  zoom: number;
  onZoom: (update: number | 'in' | 'out' | 'reset') => void;
}

/**
 * Renders the header for the main editor view.
 * Its responsibility is to display the document name, provide a way to return home,
 * and contain primary actions like downloading or sharing.
 */
const EditorHeader: React.FC<EditorHeaderProps> = ({ documentName, onClose, zoom, onZoom }) => {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <header className="bg-[#2D2D2D] h-16 px-4 flex justify-between items-center border-b border-black/20 shadow-md z-10 flex-shrink-0">
      <div className="flex items-center space-x-4">
        <Icon type="logo" />
        <div className="w-px h-6 bg-gray-600" />
        <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Back to Home">
          <Icon type="home" />
        </button>
        <div className="w-px h-6 bg-gray-600" />
        <h1 className="text-lg font-medium text-gray-200">{documentName}</h1>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-gray-900/50 p-1 rounded-lg">
        <button onClick={() => onZoom('out')} className="p-1.5 rounded-md hover:bg-gray-700 transition-colors" title="Zoom Out (-)">
          <Icon type="zoom-out" />
        </button>
        <button 
          onClick={() => onZoom('reset')} 
          className="text-sm font-semibold text-gray-300 w-16 text-center rounded-md hover:bg-gray-700 border border-transparent hover:border-gray-600 transition-colors px-2 py-1" 
          title="Reset Zoom to 100%"
        >
            {zoomPercentage}%
        </button>
        <button onClick={() => onZoom('in')} className="p-1.5 rounded-md hover:bg-gray-700 transition-colors" title="Zoom In (+)">
          <Icon type="zoom-in" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors">
          Download
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700" title="Notifications">
            <Icon type="notification"/>
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700" title="Profile">
            <Icon type="profile"/>
        </button>
      </div>
    </header>
  );
};

export default EditorHeader;