
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type AdjustSection = 'brightness' | 'levels' | 'curves';

const AdjustToolPanel = () => {
    const [openSection, setOpenSection] = useState<AdjustSection | null>('brightness');
    
    const handleToggle = (section: AdjustSection) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Brightness / Contrast" 
                icon={<Icon type="adjust" />} 
                isOpen={openSection === 'brightness'}
                onToggle={() => handleToggle('brightness')}
            >
                <p className="text-gray-500 text-sm">Adjust the brightness and contrast of the selected layer. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Levels" 
                icon={<Icon type="adjust" />}
                isOpen={openSection === 'levels'}
                onToggle={() => handleToggle('levels')}
            >
                <p className="text-gray-500 text-sm">Fine-tune the tonal range. Controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Curves" 
                icon={<Icon type="adjust" />}
                isOpen={openSection === 'curves'}
                onToggle={() => handleToggle('curves')}
            >
                <p className="text-gray-500 text-sm">Advanced tonal adjustments. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default AdjustToolPanel;