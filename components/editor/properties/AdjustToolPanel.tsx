
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const AdjustToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Brightness / Contrast" icon={<Icon type="adjust" />} defaultOpen>
                <p className="text-gray-500 text-sm">Adjust the brightness and contrast of the selected layer. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Levels" icon={<Icon type="adjust" />}>
                <p className="text-gray-500 text-sm">Fine-tune the tonal range. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Curves" icon={<Icon type="adjust" />}>
                <p className="text-gray-500 text-sm">Advanced tonal adjustments. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default AdjustToolPanel;
