
import React, { useRef } from 'react';
import { fileToBase64 } from '../../utils/imageUtils';
import Icon from '../ui/Icon';

interface AddImagePanelProps {
  onImageAdded: (url: string) => void;
}

const stockCategories = [
  {
    name: 'Animals',
    images: [
      'https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516750436280-37c1d12d4f2b?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?q=80&w=200&auto=format&fit=crop'
    ],
  },
  {
    name: 'Architecture',
    images: [
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1491901771319-424f1b3446e5?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511312351318-55d8b15104d5?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508007483479-7083d7b87c80?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop'
    ],
  },
  {
    name: 'Celestial',
    images: [
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1444703686981-a3abbc4d42e2?q=80&w=200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?q=80&w=200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1543722530-539c381011ea?q=80&w=200&auto=format&fit=crop',
    ]
  }
];

const AddImagePanel: React.FC<AddImagePanelProps> = ({ onImageAdded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      onImageAdded(base64);
    }
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />
      <button
        onClick={handleUploadClick}
        className="w-full flex items-center justify-center p-3 mb-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors duration-200 shadow-md"
      >
        <Icon type="upload" className="mr-2" />
        <span>Upload an image</span>
        <Icon type="crown" className="ml-2 text-purple-300" />
      </button>
      
      <div className="relative mb-4">
        <Icon type="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search photos"
          className="w-full bg-[#1E1E1E] border border-gray-700 rounded-md pl-10 pr-4 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto">
        {stockCategories.map(category => (
          <div key={category.name}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-300">{category.name}</h3>
              <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View all</button>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
              {category.images.map((imgSrc, index) => (
                <button
                  key={index}
                  onClick={() => onImageAdded(imgSrc)}
                  className="flex-shrink-0 w-32 h-24 bg-gray-700 rounded-md overflow-hidden hover:ring-2 ring-blue-500 ring-offset-2 ring-offset-[#2D2D2D] transition-all"
                >
                  <img src={imgSrc} alt={`${category.name} stock image ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddImagePanel;
