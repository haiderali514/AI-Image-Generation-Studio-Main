
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type EffectsSection = 'blur' | 'sharpen';

const EffectsToolPanel = () => {
    const [openSection, setOpenSection] = useState<EffectsSection | null>('blur');

    const handleToggle = (section: EffectsSection) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Blur Gallery" 
                icon={<Icon type="effects" />} 
                isOpen={openSection === 'blur'}
                onToggle={() => handleToggle('blur')}
            >
                <p className="text-gray-500 text-sm">Apply various blur effects. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Sharpen" 
                icon={<Icon type="effects" />}
                isOpen={openSection === 'sharpen'}
                onToggle={() => handleToggle('sharpen')}
            >
                <p className="text-gray-500 text-sm">Enhance the definition of edges in an image. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default EffectsToolPanel;