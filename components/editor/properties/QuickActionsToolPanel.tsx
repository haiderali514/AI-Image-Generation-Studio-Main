
import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import Icon from '../../ui/Icon';

const QuickActionsToolPanel = () => {
    return (
        <div className="space-y-2">
            <CollapsibleSection title="Quick Actions" icon={<Icon type="quick-actions" />} defaultOpen>
                <div className="space-y-2">
                    <button className="w-full text-left p-2 bg-[#363636] hover:bg-gray-700 rounded-md text-sm">Remove Background</button>
                    <button className="w-full text-left p-2 bg-[#363636] hover:bg-gray-700 rounded-md text-sm">Auto Enhance</button>
                    <button className="w-full text-left p-2 bg-[#363636] hover:bg-gray-700 rounded-md text-sm">Auto Color</button>
                </div>
            </CollapsibleSection>
        </div>
    );
};
export default QuickActionsToolPanel;
