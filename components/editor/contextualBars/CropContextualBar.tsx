import React from 'react';
import Icon from '../../ui/Icon';

interface CropContextualBarProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const CropContextualBar: React.FC<CropContextualBarProps> = ({ onConfirm, onCancel }) => {
    return (
         <>
             <button disabled className="px-3 py-2 text-sm font-medium bg-transparent text-gray-500 rounded-md flex items-center space-x-2 cursor-not-allowed">
                <Icon type="generative" />
                <span>Generative expand</span>
            </button>
             <div className="w-px h-5 bg-gray-600/50"/>
            <button onClick={onCancel} className="px-5 py-2 text-sm font-medium bg-[#363636] hover:bg-gray-700 text-gray-200 rounded-md">Cancel</button>
            <button onClick={onConfirm} className="px-5 py-2 text-sm font-medium bg-[#2F6FEF] hover:bg-blue-500 text-white rounded-md">Done</button>
        </>
    );
};

export default CropContextualBar;
