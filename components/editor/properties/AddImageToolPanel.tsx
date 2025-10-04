
import React from 'react';
import AddImagePanel from '../../panels/AddImagePanel';

interface AddImageToolPanelProps {
  onImageAdded: (url: string) => void;
}

const AddImageToolPanel: React.FC<AddImageToolPanelProps> = ({ onImageAdded }) => {
    return <AddImagePanel onImageAdded={onImageAdded} />;
};

export default AddImageToolPanel;
