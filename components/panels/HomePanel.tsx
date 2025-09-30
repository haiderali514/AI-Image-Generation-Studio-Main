
import React, { useState, useEffect } from 'react';
import { Tool, RecentProject } from '../../types';
import Icon from '../ui/Icon';
import { getRecentProjects } from '../../utils/recentProjects';

interface HomePanelProps {
  setActiveTool: (tool: Tool) => void;
  onOpenProject: (project: RecentProject) => void;
}

const QuickEditCard: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; }> = ({ label, icon, onClick }) => (
  <button onClick={onClick} className="flex items-center space-x-4 p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors duration-200 w-full text-left">
    <div className="bg-gray-700 p-2 rounded-md">
      {icon}
    </div>
    <span className="font-semibold text-gray-200">{label}</span>
  </button>
);

const EffectCard: React.FC<{ label: string; imageUrl: string }> = ({ label, imageUrl }) => (
  <div className="relative rounded-lg overflow-hidden group cursor-pointer">
    <img src={imageUrl} alt={label} className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300" />
    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300"></div>
    <span className="absolute bottom-2 left-3 font-semibold text-white">{label}</span>
  </div>
);

const formatRelativeTime = (timestamp: number): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    const days = Math.floor(diffInSeconds / (60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    return 'Today';
};

const RecentFileCard: React.FC<{ project: RecentProject; onOpen: () => void; }> = ({ project, onOpen }) => (
  <button onClick={onOpen} className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer text-left w-full transition-transform duration-200 hover:-translate-y-1">
    <div className="w-full h-32 bg-gray-700 overflow-hidden flex items-center justify-center" style={{backgroundColor: project.background === 'Custom' ? project.customBgColor : project.background.toLowerCase()}}>
       {project.thumbnail ? (
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
      ) : (
        <Icon type="document" className="w-12 h-12 text-gray-500" />
      )}
    </div>
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate text-gray-200">{project.name}</h4>
      <p className="text-xs text-gray-500">{project.width}x{project.height} - {formatRelativeTime(project.lastModified)}</p>
    </div>
  </button>
);

const HomePanel: React.FC<HomePanelProps> = ({ setActiveTool, onOpenProject }) => {
  const [recentFiles, setRecentFiles] = useState<RecentProject[]>([]);
  
  useEffect(() => {
    // Get all projects and slice the most recent 6 for the home screen
    const allProjects = getRecentProjects();
    setRecentFiles(allProjects.slice(0, 6));
  }, []);

  const quickEdits = [
    { label: 'Generate an image', icon: <Icon type="text" />, tool: Tool.TEXT_TO_IMAGE },
    { label: 'Remove background', icon: <Icon type="cut" />, tool: Tool.REMOVE_BACKGROUND },
    { label: 'Generative fill', icon: <Icon type="fill" />, tool: Tool.GENERATIVE_FILL },
    { label: 'Draw to image', icon: <Icon type="draw" />, tool: Tool.DRAW_TO_IMAGE },
    { label: 'Crop an image', icon: <Icon type="crop" />, tool: Tool.HOME }, // Placeholder
    { label: 'Color pop', icon: <Icon type="color-pop" />, tool: Tool.HOME }, // Placeholder
  ];

  const effects = [
    { label: 'Glitch', imageUrl: 'https://images.unsplash.com/photo-1593843583433-4a1b0a3a3a8a?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
    { label: 'Grain', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
    { label: 'Dither', imageUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
    { label: 'Bokeh blur', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
    { label: 'Motion blur', imageUrl: 'https://images.unsplash.com/photo-1583067139174-785952f1362a?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
    { label: 'Halftone', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
  ];

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Photoshop</h1>
          <p className="text-gray-400">What would you like to create today?</p>
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
            <button className="hover:text-white transition-colors" title="Notifications"><Icon type="notification"/></button>
            <button className="hover:text-white transition-colors" title="Your Profile"><Icon type="profile"/></button>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Make a quick edit</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {quickEdits.map(edit => <QuickEditCard key={edit.label} {...edit} onClick={() => setActiveTool(edit.tool)} />)}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Try an effect (beta)</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {effects.map(effect => <EffectCard key={effect.label} {...effect} />)}
        </div>
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent</h2>
            <button onClick={() => setActiveTool(Tool.FILES)} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">View all files</button>
        </div>
        {recentFiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {recentFiles.map(project => <RecentFileCard key={project.id} project={project} onOpen={() => onOpenProject(project)} />)}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-lg">
            <p>Your recent projects will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePanel;
