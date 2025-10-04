
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

type ShapesSection = 'rect' | 'ellipse';

const ShapesToolPanel = () => {
    const [openSection, setOpenSection] = useState<ShapesSection | null>('rect');
    
    const handleToggle = (section: ShapesSection) => {
        setOpenSection(prev => prev === section ? null : section);
    }
    
    return (
        <div className="space-y-2">
            <CollapsibleSection 
                title="Rectangle" 
                icon={<Icon type="shapes" />} 
                isOpen={openSection === 'rect'}
                onToggle={() => handleToggle('rect')}
            >
                <p className="text-gray-500 text-sm">Draw rectangles. Controls for fill, stroke, and corners will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection 
                title="Ellipse" 
                icon={<Icon type="shapes" />}
                isOpen={openSection === 'ellipse'}
                onToggle={() => handleToggle('ellipse')}
            >
                <p className="text-gray-500 text-sm">Draw ellipses and circles. Controls will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default ShapesToolPanel;