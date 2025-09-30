
import React, { useState, useEffect } from 'react';
import { getRecentProjects, RecentProject } from '../../utils/recentProjects';
import Icon from '../ui/Icon';

interface RecentFilesPanelProps {
  onOpenProject: (project: RecentProject) => void;
}

const formatRelativeTime = (timestamp: number): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `just now`;
};

const RecentFileCard: React.FC<{ project: RecentProject, onOpen: () => void }> = ({ project, onOpen }) => (
  <button onClick={onOpen} className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer text-left w-full transition-transform duration-200 hover:-translate-y-1">
    <div className="w-full h-40 bg-gray-700 overflow-hidden flex items-center justify-center" style={{backgroundColor: project.background === 'Custom' ? project.customBgColor : project.background.toLowerCase()}}>
      {project.thumbnail ? (
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
      ) : (
        <Icon type="document" className="w-16 h-16 text-gray-500" />
      )}
    </div>
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate text-gray-200">{project.name}</h4>
      <p className="text-xs text-gray-500">{project.width}x{project.height} - {formatRelativeTime(project.lastModified)}</p>
    </div>
  </button>
);


const RecentFilesPanel: React.FC<RecentFilesPanelProps> = ({ onOpenProject }) => {
    const [projects, setProjects] = useState<RecentProject[]>([]);

    useEffect(() => {
        setProjects(getRecentProjects());
    }, []);

    return (
        <div>
             <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Recent</h1>
            </header>
            {projects.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {projects.map((project) => 
                    <RecentFileCard key={project.id} project={project} onOpen={() => onOpenProject(project)} />
                  )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Icon type="files" className="mx-auto w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold">No Recent Files</h2>
                <p>Your recent projects will appear here once you create them.</p>
              </div>
            )}
        </div>
    )
}

export default RecentFilesPanel;
