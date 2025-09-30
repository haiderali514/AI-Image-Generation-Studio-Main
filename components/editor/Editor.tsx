
import React, { useState } from 'react';
import { DocumentSettings, EditorTool } from '../../types';
import EditorHeader from './EditorHeader';
import CanvasArea from './CanvasArea';
import Toolbar from './Toolbar';

interface EditorProps {
  document: DocumentSettings;
  onClose: () => void;
}

const ZOOM_STEP = 0.1;
const MAX_ZOOM = 16; // 1600%
const MIN_ZOOM = 0.1; // 10%

/**
 * The main container for the entire editor UI.
 * It orchestrates the header, toolbar, canvas, and properties panel.
 */
const Editor: React.FC<EditorProps> = ({ document, onClose }) => {
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.BRUSH);
  const [zoom, setZoom] = useState(1);

  const handleZoom = (update: number | 'in' | 'out' | 'reset') => {
    setZoom(prev => {
        let newZoom = prev;
        if (update === 'in') newZoom = prev + ZOOM_STEP;
        else if (update === 'out') newZoom = prev - ZOOM_STEP;
        else if (update === 'reset') newZoom = 1;
        else if (typeof update === 'number') newZoom = update;
        return Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-100 font-sans">
      <EditorHeader 
        documentName={document.name} 
        onClose={onClose} 
        zoom={zoom}
        onZoom={handleZoom}
      />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar activeTool={activeTool} onToolSelect={setActiveTool} />
        <main className="flex-1 bg-gray-900 overflow-hidden">
          <CanvasArea 
            document={document} 
            activeTool={activeTool} 
            zoom={zoom}
            onZoom={handleZoom}
          />
        </main>
        <PropertiesPanel activeTool={activeTool} />
      </div>
    </div>
  );
};

// Dummy components to be implemented later
const PropertiesPanel: React.FC<{ activeTool: EditorTool }> = ({ activeTool }) => (
  <aside className="w-64 bg-gray-800 p-4 border-l border-gray-700">
    <h2 className="text-lg font-semibold mb-4">Properties</h2>
    <p>Tool: {activeTool}</p>
  </aside>
);

export default Editor;
