import React from 'react';
import Icon from '../../ui/Icon';

const MoveContextualBar: React.FC = () => {
    return (
        <>
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="select-subject" />
                <span>Select subject</span>
                <Icon type="crown" className="text-purple-400" />
            </button>
            <div className="w-px h-5 bg-gray-600/50"/>
            <button className="px-3 py-2 text-sm font-medium hover:bg-[#363636] text-gray-200 rounded-md flex items-center space-x-2">
                <Icon type="image" />
                <span>Remove background</span>
            </button>
        </>
    );
};

export default MoveContextualBar;
