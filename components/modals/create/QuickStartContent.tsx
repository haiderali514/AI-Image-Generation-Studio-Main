
import React from 'react';
import { Tool } from '../../../types';
import ImageUpload from '../../ui/ImageUpload';

/**
 * @file This component renders the 'Quick Start' view for the Create Modal.
 */

interface QuickStartContentProps {
  onUpload: (file: File) => void;
  onToolSelect: (tool: Tool) => void;
}

/**
 * Represents a card for a generative AI tool.
 */
const AiToolCard: React.FC<{
  title: string;
  description: string;
  imageUrl: string;
  onClick: () => void;
}> = ({ title, description, imageUrl, onClick }) => (
  <button onClick={onClick} className="bg-gray-800/50 rounded-lg text-left transition-all duration-200 group overflow-hidden border border-transparent hover:border-blue-500 hover:bg-gray-700/50">
    <div className="w-full h-32 bg-gray-900 overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
    </div>
    <div className="p-4">
        <h4 className="font-semibold text-gray-200">{title}</h4>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
  </button>
);

/**
 * Renders the 'Quick Start' view, allowing users to upload an image or start with an AI tool.
 * This is the initial screen shown in the 'Create New' modal.
 */
const QuickStartContent: React.FC<QuickStartContentProps> = ({ onUpload, onToolSelect }) => {
    const aiTools = [
        { 
            label: 'Generate image', 
            tool: Tool.TEXT_TO_IMAGE, 
            description: 'Generate images from a detailed text description.',
            imageUrl: 'https://images.unsplash.com/photo-1684331495444-88ebb45334cb?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'
        },
        { 
            label: 'Generative fill', 
            tool: Tool.GENERATIVE_FILL, 
            description: 'Add or remove objects with a text prompt.',
            imageUrl: 'https://images.unsplash.com/photo-1683424774581-79275b6a78f1?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'
        },
        { 
            label: 'Generative expand', 
            tool: Tool.REMOVE_BACKGROUND, // Placeholder mapping
            description: 'Expand your image with text prompts.',
            imageUrl: 'https://images.unsplash.com/photo-1684331495444-88ebb45334cb?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'
        },
    ];
    return (
        <div className="space-y-8">
            <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100">Create from an image</h2>
            <div className="bg-gray-800/30 rounded-lg p-2">
                <ImageUpload onUpload={onUpload} title="Upload a file to start editing" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Tap into the power of generative AI</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiTools.map(item => (
                         <AiToolCard 
                            key={item.label}
                            title={item.label}
                            description={item.description}
                            imageUrl={item.imageUrl}
                            onClick={() => onToolSelect(item.tool)} 
                         />
                    ))}
                </div>
            </div>
        </div>
    )
};

export default QuickStartContent;
