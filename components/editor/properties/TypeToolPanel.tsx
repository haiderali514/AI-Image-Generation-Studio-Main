
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type TypeSection = 'char' | 'paragraph';

const TypeToolPanel = () => {
    const [openSection, setOpenSection] = useState<TypeSection | null>('char');

    const handleToggle = (section: TypeSection) => {
        setOpenSection(prev => prev === section ? null : section);
    };

    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Character" 
                icon={<Icon type="type" />} 
                isOpen={openSection === 'char'}
                onToggle={() => handleToggle('char')}
            >
                <p className="text-gray-500 text-sm">Controls for font family, size, color, and spacing will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Paragraph" 
                icon={<Icon type="align-left" />}
                isOpen={openSection === 'paragraph'}
                onToggle={() => handleToggle('paragraph')}
            >
                <p className="text-gray-500 text-sm">Controls for alignment, indentation, and paragraph spacing will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default TypeToolPanel;