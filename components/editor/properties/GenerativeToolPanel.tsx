
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const GenerativeToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Generative Fill" icon={<Icon type="fill" />} defaultOpen>
                <p className="text-gray-500 text-sm">Fill a selection with AI-generated content based on a text prompt. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Generative Expand" icon={<Icon type="crop" />}>
                <p className="text-gray-500 text-sm">Expand the canvas with AI-generated content. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default GenerativeToolPanel;
