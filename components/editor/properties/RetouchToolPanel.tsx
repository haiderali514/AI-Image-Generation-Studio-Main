
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const RetouchToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Spot Healing Brush" icon={<Icon type="retouch" />} defaultOpen>
                <p className="text-gray-500 text-sm">Remove unwanted spots and blemishes. Brush controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Clone Stamp" icon={<Icon type="retouch" />}>
                <p className="text-gray-500 text-sm">Paint with pixels from another part of the image. Brush controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default RetouchToolPanel;
