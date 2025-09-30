
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TextToImagePanel from './components/panels/TextToImagePanel';
import DrawToImagePanel from './components/panels/DrawToImagePanel';
import GenerativeFillPanel from './components/panels/GenerativeFillPanel';
import RemoveBackgroundPanel from './components/panels/RemoveBackgroundPanel';
import HomePanel from './components/panels/HomePanel';
import RecentFilesPanel from './components/panels/RecentFilesPanel';
import CreateModal from './components/modals/CreateModal';
import Editor from './components/editor/Editor';
import { Tool, DocumentSettings, RecentProject } from './types';
import { addRecentProject } from './utils/recentProjects';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.HOME);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings | null>(null);

  const handleCreateDocument = (settings: DocumentSettings) => {
    const newProject = addRecentProject(settings);
    setDocumentSettings(newProject);
    setIsEditorOpen(true);
    setIsCreateModalOpen(false);
  };
  
  const handleOpenRecentProject = (project: RecentProject) => {
    setDocumentSettings(project);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setDocumentSettings(null);
    setActiveTool(Tool.HOME); // Return to home screen
  };

  const content = useMemo(() => {
    switch (activeTool) {
      case Tool.HOME:
        return <HomePanel setActiveTool={setActiveTool} onOpenProject={handleOpenRecentProject} />;
      case Tool.FILES:
        return <RecentFilesPanel onOpenProject={handleOpenRecentProject} />;
      case Tool.TEXT_TO_IMAGE:
        return <TextToImagePanel />;
      case Tool.DRAW_TO_IMAGE:
        return <DrawToImagePanel />;
      case Tool.GENERATIVE_FILL:
        return <GenerativeFillPanel />;
      case Tool.REMOVE_BACKGROUND:
        return <RemoveBackgroundPanel />;
      default:
        return <HomePanel setActiveTool={setActiveTool} onOpenProject={handleOpenRecentProject} />;
    }
  }, [activeTool]);

  if (isEditorOpen && documentSettings) {
    return <Editor document={documentSettings} onClose={handleCloseEditor} />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          {content}
        </div>
      </main>
      <CreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreate={handleCreateDocument}
      />
    </div>
  );
};

export default App;
