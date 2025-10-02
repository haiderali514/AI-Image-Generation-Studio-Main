
import React from 'react';
import Icon from '../ui/Icon';

const FloatingActionBar: React.FC = () => {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#2D2D2D] border border-black/30 rounded-lg p-1.5 flex items-center space-x-2 shadow-2xl">
            <button className="px-3 py-1.5 flex items-center space-x-2 hover:bg-[#363636] rounded-md">
                <Icon type="select-subject" />
                <span className="text-sm font-medium">Select subject</span>
            </button>
             <div className="w-px h-5 bg-gray-600/50"/>
            <button className="px-3 py-1.5 flex items-center space-x-2 hover:bg-[#363636] rounded-md">
                <Icon type="clear" />
                <span className="text-sm font-medium">Remove background</span>
            </button>
        </div>
    );
};

export default FloatingActionBar;