
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type SelectSection = 'rect' | 'ellipse' | 'subject';

const SelectToolPanel = () => {
    const [openSection, setOpenSection] = useState<SelectSection | null>('rect');

    const handleToggle = (section: SelectSection) => {
        setOpenSection(prev => prev === section ? null : section);
    }

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Rectangular Marquee" 
                icon={<Icon type="selection" />} 
                isOpen={openSection === 'rect'}
                onToggle={() => handleToggle('rect')}
            >
                <p className="text-gray-500 text-sm">Create rectangular selections. Options will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Elliptical Marquee" 
                icon={<Icon type="selection" />}
                isOpen={openSection === 'ellipse'}
                onToggle={() => handleToggle('ellipse')}
            >
                <p className="text-gray-500 text-sm">Create elliptical selections. Options will appear here.</p>
            </CollapsibleSection>
             <CollapsibleSection 
                title="Select Subject" 
                icon={<Icon type="select-subject" />}
                isOpen={openSection === 'subject'}
                onToggle={() => handleToggle('subject')}
            >
                <p className="text-gray-500 text-sm">Automatically select the main subject in a layer. Options will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default SelectToolPanel;