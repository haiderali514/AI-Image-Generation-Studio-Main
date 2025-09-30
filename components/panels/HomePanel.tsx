
import React from 'react';
import { Tool } from '../../types';
import Icon from '../ui/Icon';

interface HomePanelProps {
  setActiveTool: (tool: Tool) => void;
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

const RecentFileCard: React.FC<{ title: string; type: string; time: string; imageUrl: string }> = ({ title, type, time, imageUrl }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
    <div className="w-full h-32 bg-gray-700 overflow-hidden">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
    </div>
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate text-gray-200">{title}</h4>
      <p className="text-xs text-gray-500">{type} - {time}</p>
    </div>
  </div>
);

const HomePanel: React.FC<HomePanelProps> = ({ setActiveTool }) => {
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
  
  const recentFiles = [
      {title: 'modern youtube studio...', type: 'Image', time: '1 month ago', imageUrl: 'https://images.unsplash.com/photo-1620173834206-a11b84218864?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'Untitled-1', type: 'PDDC', time: '1 day ago', imageUrl: 'https://images.unsplash.com/photo-1618355752181-1283d6723c34?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'Remove background proj...', type: 'Filer', time: '7 months ago', imageUrl: 'https://plus.unsplash.com/premium_photo-1661699927429-6563a9533c30?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'},
  ]

  return (
    <div className="p-6 md:p-8 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Photoshop</h1>
          <p className="text-gray-400">What would you like to create today?</p>
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
            <button className="hover:text-white transition-colors"><Icon type="notification"/></button>
            <button className="hover:text-white transition-colors"><Icon type="profile"/></button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentFiles.map(file => <RecentFileCard key={file.title} {...file} />)}
        </div>
      </section>
    </div>
  );
};

export default HomePanel;
