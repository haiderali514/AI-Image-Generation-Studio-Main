
import React from 'react';

const RecentFileCard: React.FC<{ title: string; type: string; time: string; imageUrl: string }> = ({ title, type, time, imageUrl }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer">
    <div className="w-full h-40 bg-gray-700 overflow-hidden">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
    </div>
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate text-gray-200">{title}</h4>
      <p className="text-xs text-gray-500">{type} - {time}</p>
    </div>
  </div>
);


const RecentFilesPanel: React.FC = () => {
    
    const recentFiles = [
      {title: 'Untitled-1', type: 'PDDC', time: '1 day ago', imageUrl: 'https://images.unsplash.com/photo-1618355752181-1283d6723c34?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'modern youtube studio...', type: 'Image', time: '1 month ago', imageUrl: 'https://images.unsplash.com/photo-1620173834206-a11b84218864?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'modern youtube studio...', type: 'Image', time: '1 month ago', imageUrl: 'https://images.unsplash.com/photo-1620173834206-a11b84218864?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'modern youtube studio...', type: 'Image', time: '1 month ago', imageUrl: 'https://images.unsplash.com/photo-1620173834206-a11b84218864?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'modern youtube studio...', type: 'Image', time: '1 month ago', imageUrl: 'https://images.unsplash.com/photo-1620173834206-a11b84218864?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max' },
      {title: 'Remove background proj...', type: 'Filer', time: '7 months ago', imageUrl: 'https://plus.unsplash.com/premium_photo-1661699927429-6563a9533c30?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'},
      {title: 'Image-19-June-2024.ai', type: 'Filer', time: '2 days ago', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'},
      {title: 'Image-19-June-2024.ai', type: 'Filer', time: '2 days ago', imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'},
      {title: 'Your Photoshop Swatch has...', type: 'Filer', time: '3 days ago', imageUrl: 'https://images.unsplash.com/photo-1511382495940-a7b63c733912?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max'},
    ];


    return (
        <div>
             <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Recent</h1>
                <button className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-gray-800 px-4 py-2 rounded-lg">View all files</button>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {recentFiles.map((file, index) => <RecentFileCard key={`${file.title}-${index}`} {...file} />)}
            </div>
        </div>
    )
}

export default RecentFilesPanel;