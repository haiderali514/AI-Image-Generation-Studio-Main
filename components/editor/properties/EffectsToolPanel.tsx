
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const EffectsToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Blur Gallery" icon={<Icon type="effects" />} defaultOpen>
                <p className="text-gray-500 text-sm">Apply various blur effects. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Sharpen" icon={<Icon type="effects" />}>
                <p className="text-gray-500 text-sm">Enhance the definition of edges in an image. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default EffectsToolPanel;
