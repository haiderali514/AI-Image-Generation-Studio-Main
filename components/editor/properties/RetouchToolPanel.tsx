
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type RetouchSection = 'spotHeal' | 'cloneStamp';

const RetouchToolPanel = () => {
    const [openSection, setOpenSection] = useState<RetouchSection | null>('spotHeal');
    
    const handleToggle = (section: RetouchSection) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Spot Healing Brush" 
                icon={<Icon type="retouch" />} 
                isOpen={openSection === 'spotHeal'}
                onToggle={() => handleToggle('spotHeal')}
            >
                <p className="text-gray-500 text-sm">Remove unwanted spots and blemishes. Brush controls will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Clone Stamp" 
                icon={<Icon type="retouch" />}
                isOpen={openSection === 'cloneStamp'}
                onToggle={() => handleToggle('cloneStamp')}
            >
                <p className="text-gray-500 text-sm">Paint with pixels from another part of the image. Brush controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default RetouchToolPanel;