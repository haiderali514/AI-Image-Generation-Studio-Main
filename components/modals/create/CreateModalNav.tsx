
import React from 'react';
import Icon from '../../ui/Icon';

/**
 * @file This file defines the navigation component for the 'Create New' modal.
 */

/**
 * The different views available in the CreateModal.
 */
export type ModalView = 'quickStart' | 'blankDoc' | 'customDoc';

interface CreateModalNavProps {
  activeView: ModalView;
  setActiveView: (view: ModalView) => void;
}

/**
 * A navigation item button used within the CreateModalNav.
 */
const NavItem: React.FC<{
  label: string;
  view: ModalView;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, view, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full space-x-3 p-3 rounded-lg text-left transition-colors ${
      isActive ? 'bg-gray-600' : 'hover:bg-gray-700/50'
    }`}
  >
    <div className="text-gray-400">{icon}</div>
    <span className="font-medium text-gray-200">{label}</span>
  </button>
);

/**
 * Renders the sidebar navigation for the 'Create New' modal.
 * Its responsibility is to allow users to switch between different document creation views.
 */
const CreateModalNav: React.FC<CreateModalNavProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-1/4 min-w-[250px] bg-[#252525] p-4 space-y-4 border-r border-black/20">
      <div className="relative mb-4">
        <Icon type="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-gray-800/50 border border-gray-600 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Quickstart</h3>
        <div className="space-y-1 mt-1">
          <NavItem
            label="Quick start"
            view="quickStart"
            icon={<Icon type="sparkle" />}
            isActive={activeView === 'quickStart'}
            onClick={() => setActiveView('quickStart')}
          />
          <NavItem
            label="Blank document"
            view="blankDoc"
            icon={<Icon type="document" />}
            isActive={activeView === 'blankDoc'}
            onClick={() => setActiveView('blankDoc')}
          />
          <NavItem
            label="Custom size"
            view="customDoc"
            icon={<Icon type="crop" />}
            isActive={activeView === 'customDoc'}
            onClick={() => setActiveView('customDoc')}
          />
        </div>
      </div>
    </aside>
  );
};

export default CreateModalNav;
