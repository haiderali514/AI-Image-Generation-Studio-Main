
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const GenerativeToolPanel = () => {
    const [openSection, setOpenSection] = useState<'fill' | 'expand' | null>('fill');

    const handleToggle = (section: 'fill' | 'expand') => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Generative Fill" 
                icon={<Icon type="fill" />} 
                isOpen={openSection === 'fill'}
                onToggle={() => handleToggle('fill')}
            >
                <p className="text-gray-500 text-sm">Fill a selection with AI-generated content based on a text prompt. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Generative Expand" 
                icon={<Icon type="crop" />}
                isOpen={openSection === 'expand'}
                onToggle={() => handleToggle('expand')}
            >
                <p className="text-gray-500 text-sm">Expand the canvas with AI-generated content. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default GenerativeToolPanel;