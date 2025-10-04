
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const ShapesToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Rectangle" icon={<Icon type="shapes" />} defaultOpen>
                <p className="text-gray-500 text-sm">Draw rectangles. Controls for fill, stroke, and corners will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Ellipse" icon={<Icon type="shapes" />}>
                <p className="text-gray-500 text-sm">Draw ellipses and circles. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default ShapesToolPanel;
