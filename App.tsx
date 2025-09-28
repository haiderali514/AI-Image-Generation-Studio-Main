
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TextToImagePanel from './components/panels/TextToImagePanel';
import DrawToImagePanel from './components/panels/DrawToImagePanel';
import GenerativeFillPanel from './components/panels/GenerativeFillPanel';
import RemoveBackgroundPanel from './components/panels/RemoveBackgroundPanel';
import Header from './components/Header';
import { Tool } from './types';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.TEXT_TO_IMAGE);

  const renderContent = () => {
    switch (activeTool) {
      case Tool.TEXT_TO_IMAGE:
        return <TextToImagePanel />;
      case Tool.DRAW_TO_IMAGE:
        return <DrawToImagePanel />;
      case Tool.GENERATIVE_FILL:
        return <GenerativeFillPanel />;
      case Tool.REMOVE_BACKGROUND:
        return <RemoveBackgroundPanel />;
      default:
        return <TextToImagePanel />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
