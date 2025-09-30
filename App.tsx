import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TextToImagePanel from './components/panels/TextToImagePanel';
import DrawToImagePanel from './components/panels/DrawToImagePanel';
import GenerativeFillPanel from './components/panels/GenerativeFillPanel';
import RemoveBackgroundPanel from './components/panels/RemoveBackgroundPanel';
import HomePanel from './components/panels/HomePanel';
import RecentFilesPanel from './components/panels/RecentFilesPanel';
import CreateModal from './components/modals/CreateModal';
import { Tool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.HOME);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const content = useMemo(() => {
    switch (activeTool) {
      case Tool.HOME:
        return <HomePanel setActiveTool={setActiveTool} />;
      case Tool.FILES:
        return <RecentFilesPanel />;
      case Tool.TEXT_TO_IMAGE:
        return <TextToImagePanel />;
      case Tool.DRAW_TO_IMAGE:
        return <DrawToImagePanel />;
      case Tool.GENERATIVE_FILL:
        return <GenerativeFillPanel />;
      case Tool.REMOVE_BACKGROUND:
        return <RemoveBackgroundPanel />;
      default:
        return <HomePanel setActiveTool={setActiveTool} />;
    }
  }, [activeTool]);

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
        setActiveTool={setActiveTool} 
      />
    </div>
  );
};

export default App;