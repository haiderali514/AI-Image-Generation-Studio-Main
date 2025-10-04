
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const SelectToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Rectangular Marquee" icon={<Icon type="selection" />} defaultOpen>
                <p className="text-gray-500 text-sm">Create rectangular selections. Options will appear here.</p>
            </CollapsibleSection>
            <CollapsibleSection title="Elliptical Marquee" icon={<Icon type="selection" />}>
                <p className="text-gray-500 text-sm">Create elliptical selections. Options will appear here.</p>
            </CollapsibleSection>
             <CollapsibleSection title="Select Subject" icon={<Icon type="select-subject" />}>
                <p className="text-gray-500 text-sm">Automatically select the main subject in a layer. Options will appear here.</p>
            </CollapsibleSection>
        </div>
    );
};
export default SelectToolPanel;
