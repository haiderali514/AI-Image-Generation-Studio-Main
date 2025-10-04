
import React, { useState } from 'react';
import Icon from '../../ui/Icon';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[#1E1E1E] rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 flex items-center space-x-2 text-left transition-colors ${isOpen ? 'bg-[#363636]' : 'hover:bg-[#363636]/60'}`}
      >
        {icon}
        <span className="flex-1 font-medium">{title}</span>
        <Icon type={isOpen ? 'chevron-down' : 'chevron-right'} className="text-gray-500"/>
      </button>
      {isOpen && (
        <div className="p-3 border-t border-black/30">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
