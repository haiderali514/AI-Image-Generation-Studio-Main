
import React, { useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Input from '../ui/Input';

export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, quality?: number) => void;
  documentName: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, documentName }) => {
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [fileName, setFileName] = useState(documentName);

  if (!isOpen) return null;

  const formatOptions = [
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPG' },
    { value: 'image/webp', label: 'WebP' },
  ];

  const handleExport = () => {
    const finalFileName = fileName || documentName;
    const exportQuality = format === 'image/png' ? undefined : quality;
    onExport(format, exportQuality);
    onClose();
  }

  const getFileExtension = () => {
    switch(format) {
        case 'image/jpeg': return '.jpg';
        case 'image/webp': return '.webp';
        case 'image/png':
        default: return '.png';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-[#2D2D2D] w-full max-w-md rounded-xl shadow-2xl p-6" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        <div className="flex justify-between items-center mb-6">
          <h2 id="export-modal-title" className="text-xl font-semibold">Export Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Close">
            <Icon type="close" />
          </button>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">File name</label>
                <div className="flex items-center">
                    <Input value={fileName} onChange={e => setFileName(e.target.value)} className="rounded-r-none" />
                    <span className="bg-[#1E1E1E] border border-gray-700 border-l-0 rounded-r-md px-3 py-2 text-gray-400">{getFileExtension()}</span>
                </div>
            </div>
            <Select label="Format" options={formatOptions} value={format} onChange={(val) => setFormat(val as ExportFormat)} />
            {format !== 'image/png' && (
                <div>
                    <label htmlFor="quality" className="block text-sm font-medium text-gray-400 mb-1">Quality</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="range"
                            id="quality"
                            min="0.1"
                            max="1"
                            step="0.01"
                            value={quality}
                            onChange={(e) => setQuality(parseFloat(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                        <span className="text-sm text-gray-300 w-12 text-right">{Math.round(quality * 100)}%</span>
                    </div>
                </div>
            )}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded-md font-medium">Cancel</button>
          <button onClick={handleExport} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md font-medium">Export</button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
