
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const TypeToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Character" icon={<Icon type="type" />} defaultOpen>
                <p className="text-gray-500 text-sm">Controls for font family, size, color, and spacing will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Paragraph" icon={<Icon type="align-left" />}>
                <p className="text-gray-500 text-sm">Controls for alignment, indentation, and paragraph spacing will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default TypeToolPanel;
