
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tool } from '../../types';
import Icon from '../ui/Icon';
import ImageUpload from '../ui/ImageUpload';
import Button from '../ui/Button';
import { fileToBase64 } from '../../utils/imageUtils';
import Select from '../ui/Select';


interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTool: (tool: Tool) => void;
}

type ModalView = 'quickStart' | 'blankDoc' | 'customDoc';

interface CustomPreset {
  name: string;
  w: number;
  h: number;
  res: number;
  units: string;
  bg: string;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, setActiveTool }) => {
  const [activeView, setActiveView] = useState<ModalView>('quickStart');
  
  // State for the custom document form
  const [docName, setDocName] = useState('Untitled-1');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [units, setUnits] = useState('Pixels');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [resolution, setResolution] = useState(72);
  const [background, setBackground] = useState('White');
  const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
  
  // State for presets
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedPresets = localStorage.getItem('photoshop-ai-presets');
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    }
  }, [isOpen]);

  const handleSavePreset = (presetName: string) => {
    if (!presetName.trim()) {
        alert('Preset name cannot be empty.');
        return;
    }
    if (customPresets.some(p => p.name === presetName)) {
        alert('A preset with this name already exists. Please choose a different name or delete the existing one.');
        return;
    }
    const newPreset: CustomPreset = {
        name: presetName,
        w: width,
        h: height,
        res: resolution,
        units: units,
        bg: background,
    };
    const updatedPresets = [...customPresets, newPreset];
    setCustomPresets(updatedPresets);
    localStorage.setItem('photoshop-ai-presets', JSON.stringify(updatedPresets));
    alert(`Preset "${presetName}" saved!`);
  };

  const handleDeletePreset = (presetName: string) => {
      const updatedPresets = customPresets.filter(p => p.name !== presetName);
      setCustomPresets(updatedPresets);
      localStorage.setItem('photoshop-ai-presets', JSON.stringify(updatedPresets));
  };


  const handleToolSelect = useCallback((tool: Tool) => {
    setActiveTool(tool);
    onClose();
  }, [setActiveTool, onClose]);

  const handleImageUpload = useCallback(async (file: File) => {
    handleToolSelect(Tool.GENERATIVE_FILL);
  }, [handleToolSelect]);
  
  const handleCreateCustom = () => {
    handleToolSelect(Tool.TEXT_TO_IMAGE);
  };
  
  const handleSetPreset = (preset: Partial<CustomPreset> & { w: number, h: number, name: string }) => {
    setWidth(preset.w);
    setHeight(preset.h);
    setDocName(preset.name);
    setOrientation(preset.w > preset.h ? 'landscape' : 'portrait');
    setResolution(preset.res ?? 72);
    setUnits(preset.units ?? 'Pixels');
    setBackground(preset.bg ?? 'White');
    setActiveView('customDoc');
  };

  if (!isOpen) return null;

  const NavItem: React.FC<{ label: string; view: ModalView; icon: React.ReactNode }> = ({ label, view, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center w-full space-x-3 p-3 rounded-lg text-left transition-colors ${activeView === view ? 'bg-gray-600' : 'hover:bg-gray-700/50'}`}
    >
      <div className="text-gray-400">{icon}</div>
      <span className="font-medium text-gray-200">{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'quickStart':
        return <QuickStartContent onUpload={handleImageUpload} onToolSelect={handleToolSelect} />;
      case 'blankDoc':
        return <BlankDocumentContent onPresetSelect={handleSetPreset} customPresets={customPresets} onDeletePreset={handleDeletePreset} />;
      case 'customDoc':
        return (
          <CustomDocumentContent
            docName={docName} setDocName={setDocName}
            width={width} setWidth={setWidth}
            height={height} setHeight={setHeight}
            units={units} setUnits={setUnits}
            orientation={orientation} setOrientation={setOrientation}
            resolution={resolution} setResolution={setResolution}
            background={background} setBackground={setBackground}
            customBgColor={customBgColor} setCustomBgColor={setCustomBgColor}
            onCreate={handleCreateCustom}
            onSavePreset={handleSavePreset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-[#2D2D2D] w-full max-w-5xl h-[80vh] max-h-[700px] rounded-xl shadow-2xl flex overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <Icon type="close" />
        </button>
        
        <aside className="w-1/4 min-w-[250px] bg-[#252525] p-4 space-y-4 border-r border-black/20">
          <div className="relative mb-4">
            <Icon type="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search" className="w-full bg-gray-800/50 border border-gray-600 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <h3 className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Quickstart</h3>
            <div className="space-y-1 mt-1">
              <NavItem label="Quick start" view="quickStart" icon={<Icon type="sparkle" />} />
              <NavItem label="Blank document" view="blankDoc" icon={<Icon type="document" />} />
              <NavItem label="Custom size" view="customDoc" icon={<Icon type="crop" />} />
            </div>
          </div>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};


const QuickStartContent: React.FC<{onUpload: (file: File) => void, onToolSelect: (tool: Tool) => void}> = ({ onUpload, onToolSelect }) => {
    const aiTools = [
        { label: 'Generate image', tool: Tool.TEXT_TO_IMAGE, description: 'Generate images from a detailed text description.'},
        { label: 'Generative fill', tool: Tool.GENERATIVE_FILL, description: 'Add or remove objects with a text prompt.'},
        { label: 'Remove Background', tool: Tool.REMOVE_BACKGROUND, description: 'Automatically remove the background from an image.'},
    ];
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-100">Quick start</h2>
            <div className="bg-gray-800/30 rounded-lg p-2">
                <ImageUpload onUpload={onUpload} title="Upload a file to start editing" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">Or start with a quick tool</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiTools.map(item => (
                         <button key={item.label} onClick={() => onToolSelect(item.tool)} className="bg-gray-700/50 hover:bg-gray-600/50 p-4 rounded-lg text-left transition-colors">
                            <h4 className="font-semibold text-gray-200">{item.label}</h4>
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
            isActive ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const BlankDocumentContent: React.FC<{
  onPresetSelect: (preset: any) => void;
  customPresets: CustomPreset[];
  onDeletePreset: (name: string) => void;
}> = ({ onPresetSelect, customPresets, onDeletePreset }) => {
    const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
    const [deletingPresetName, setDeletingPresetName] = useState<string | null>(null);

    const handleDeleteConfirm = (name: string) => {
        onDeletePreset(name);
        setDeletingPresetName(null);
    };

    const handleDeleteCancel = () => {
        setDeletingPresetName(null);
    };

    const defaultPresets = [
        { name: 'HDTV 1080p', w: 1920, h: 1080 },
        { name: 'Default', w: 1920, h: 1080 },
        { name: 'Instagram Post', w: 1080, h: 1080 },
        { name: 'Instagram Story', w: 1080, h: 1920 },
        { name: 'A4 Document', w: 2480, h: 3508 },
    ]
    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">Create a blank document</h2>
            <div className="flex border-b border-gray-700 mb-6">
                <TabButton label="Recent" isActive={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
                <TabButton label="Saved" isActive={activeTab === 'saved'} onClick={() => setActiveTab('saved')} />
            </div>
            {activeTab === 'recent' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {defaultPresets.map(p => (
                        <button key={p.name} onClick={() => onPresetSelect(p)} className="aspect-[4/3] bg-gray-800/50 border-2 border-transparent hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors">
                            <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                            <p className="font-semibold text-gray-200">{p.name}</p>
                            <p className="text-sm text-gray-400">{p.w} x {p.h} px</p>
                        </button>
                    ))}
                </div>
            )}
            {activeTab === 'saved' && (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {customPresets.length === 0 ? (
                        <div className="text-gray-500 col-span-full text-center py-10">
                          <Icon type="save" className="mx-auto w-12 h-12 text-gray-600 mb-2" />
                          <p className="font-semibold">You have no saved presets.</p>
                          <p className="text-sm">Create a custom document to save a new preset.</p>
                        </div>
                    ) : (
                        customPresets.map(p => (
                             <div key={p.name} className="group relative aspect-[4/3] bg-gray-800/50 rounded-lg">
                                <button onClick={() => onPresetSelect(p)} className="w-full h-full border-2 border-transparent hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                                    <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                                    <p className="font-semibold text-gray-200 truncate w-full">{p.name}</p>
                                    <p className="text-sm text-gray-400">{p.w} x {p.h} {p.units}</p>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingPresetName(p.name); }} 
                                    className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                                    aria-label={`Delete preset ${p.name}`}
                                    disabled={!!deletingPresetName}
                                >
                                    <Icon type="trash" />
                                </button>
                                {deletingPresetName === p.name && (
                                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 space-y-3 transition-opacity">
                                        <p className="font-semibold text-white text-center">Delete preset?</p>
                                        <div className="flex space-x-2">
                                            <button onClick={handleDeleteCancel} className="px-3 py-1 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded font-medium">Cancel</button>
                                            <button onClick={() => handleDeleteConfirm(p.name)} className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-500 rounded font-medium">Delete</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
};

const CustomDocumentContent: React.FC<any> = ({ docName, setDocName, width, setWidth, height, setHeight, units, setUnits, orientation, setOrientation, resolution, setResolution, background, setBackground, customBgColor, setCustomBgColor, onCreate, onSavePreset }) => {
  
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameToSave, setPresetNameToSave] = useState('');
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
  const aspectRatioRef = useRef(width / height);

  const unitOptions = [
    { value: 'Pixels', label: 'Pixels' },
    { value: 'Inches', label: 'Inches' },
    { value: 'Centimeters', label: 'Centimeters' },
    { value: 'Millimeters', label: 'Millimeters' },
    { value: 'Points', label: 'Points' },
    { value: 'Picas', label: 'Picas' },
  ];

  const backgroundOptions = [
      { value: 'White', label: 'White' },
      { value: 'Black', label: 'Black' },
      { value: 'Transparent', label: 'Transparent' },
      { value: 'Custom', label: 'Custom' },
  ];
  
  const handleInitiateSave = () => {
    setPresetNameToSave(docName);
    setIsSavingPreset(true);
  };

  const handleConfirmSave = () => {
    onSavePreset(presetNameToSave);
    setIsSavingPreset(false);
  };

  const handleCancelSave = () => {
    setIsSavingPreset(false);
  };

  const toggleLock = () => {
    if (!isAspectRatioLocked) {
        aspectRatioRef.current = width > 0 && height > 0 ? width / height : 1;
    }
    setIsAspectRatioLocked(prev => !prev);
  };

  const handleWidthChange = (newWidthValue: string) => {
    const newWidth = parseInt(newWidthValue, 10) || 0;
    setWidth(newWidth);
    if (isAspectRatioLocked && aspectRatioRef.current > 0) {
      setHeight(Math.round(newWidth / aspectRatioRef.current));
    }
  };

  const handleHeightChange = (newHeightValue: string) => {
    const newHeight = parseInt(newHeightValue, 10) || 0;
    setHeight(newHeight);
    if (isAspectRatioLocked) {
      setWidth(Math.round(newHeight * aspectRatioRef.current));
    }
  };

  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
      setOrientation(newOrientation);
      if ((newOrientation === 'landscape' && height > width) || (newOrientation === 'portrait' && width > height)) {
          const oldWidth = width;
          setWidth(height);
          setHeight(oldWidth);
      }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-semibold text-gray-100 mb-6">Create a custom blank document</h2>
      <div className="flex-1 space-y-4 pr-4">
        {isSavingPreset ? (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600 space-y-3">
            <label htmlFor="presetName" className="block text-sm font-semibold text-gray-300">Preset name</label>
            <input 
              id="presetName"
              value={presetNameToSave} 
              onChange={e => setPresetNameToSave(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" onClick={handleCancelSave} className="px-3 py-1 text-sm">Cancel</Button>
              <Button onClick={handleConfirmSave} className="px-3 py-1 text-sm">Save</Button>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="docName" className="block text-sm font-medium text-gray-400 mb-1">Document name</label>
            <div className="relative">
              <input 
                id="docName"
                value={docName} 
                onChange={e => setDocName(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
              />
              <button 
                onClick={handleInitiateSave}
                title="Save Preset"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors"
                aria-label="Save preset"
              >
                <Icon type="save" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <Input label="Width" type="number" value={width} onChange={e => handleWidthChange(e.target.value)} />
            <Select label="Units" options={unitOptions} value={units} onChange={setUnits} />
        </div>

        <div className="flex justify-center -my-2 text-gray-500">
            <button 
                onClick={toggleLock} 
                title={isAspectRatioLocked ? "Constrain aspect ratio" : "Do not constrain aspect ratio"} 
                className="p-1 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
            >
                <Icon type={isAspectRatioLocked ? 'lock' : 'unlock'} className="w-8 h-8"/>
            </button>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
            <Input label="Height" type="number" value={height} onChange={e => handleHeightChange(e.target.value)} />
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Orientation</label>
                <div className="flex space-x-2">
                    <button onClick={() => handleOrientationChange('portrait')} className={`p-2 rounded-md ${orientation === 'portrait' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}><Icon type="orientation-portrait"/></button>
                    <button onClick={() => handleOrientationChange('landscape')} className={`p-2 rounded-md ${orientation === 'landscape' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}><Icon type="orientation-landscape"/></button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Resolution</label>
              <div className="flex items-center space-x-2">
                  <Input value={resolution} type="number" onChange={e => setResolution(parseInt(e.target.value))} />
                  <span className="text-gray-400 text-sm">ppi</span>
              </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-400 mb-1">Background contents</label>
                 <div className="flex items-center space-x-2">
                    <Select options={backgroundOptions} value={background} onChange={setBackground} />
                    {background === 'Custom' && (
                      <input type="color" value={customBgColor} onChange={e => setCustomBgColor(e.target.value)} className="w-10 h-10 p-0 border-none rounded cursor-pointer bg-transparent"/>
                    )}
                 </div>
            </div>
        </div>
      </div>
      <div className="flex justify-end pt-6 border-t border-gray-700/50">
        <Button onClick={onCreate}>Create</Button>
      </div>
    </div>
  );
};

const Input: React.FC<{label?: string, value: any, onChange: any, type?: string}> = ({ label, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            <input 
                {...props}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        </div>
    </div>
);


export default CreateModal;
