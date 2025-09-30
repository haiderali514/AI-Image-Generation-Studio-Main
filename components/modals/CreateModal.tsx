
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tool } from '../../types';
import Icon from '../ui/Icon';
import ImageUpload from '../ui/ImageUpload';
import Button from '../ui/Button';
import { fileToBase64 } from '../../utils/imageUtils';
import Select from '../ui/Select';
import ColorPicker from '../ui/ColorPicker';


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
  bgColor?: string;
}

const defaultPresets: (Partial<CustomPreset> & { name: string; w: number; h: number; })[] = [
    { name: 'HDTV 1080p', w: 1920, h: 1080, res: 72 },
    { name: 'Default', w: 1510, h: 1080, res: 72 },
    { name: 'Instagram Post', w: 1080, h: 1080, res: 72 },
    { name: 'Instagram Story', w: 1080, h: 1920, res: 72 },
    { name: 'A4 Document', w: 2480, h: 3508, res: 300 },
];


const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, setActiveTool }) => {
  const [activeView, setActiveView] = useState<ModalView>('quickStart');
  
  // State for the custom document form
  const [docSettings, setDocSettings] = useState({
    name: 'Untitled-1',
    width: 1510,
    height: 1080,
    units: 'Pixels',
    resolution: 72,
    resolutionUnit: 'ppi',
    background: 'White',
    customBgColor: '#FFFFFF',
    preset: 'Default',
  });
  
  // State for presets
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedPresets = localStorage.getItem('photoshop-ai-presets');
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
      // Reset to default view when opening
      setActiveView('quickStart');
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
        w: docSettings.width,
        h: docSettings.height,
        res: docSettings.resolution,
        units: docSettings.units,
        bg: docSettings.background,
        bgColor: docSettings.customBgColor
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
    setDocSettings({
        name: preset.name,
        width: preset.w,
        height: preset.h,
        resolution: preset.res ?? 72,
        resolutionUnit: 'ppi',
        units: preset.units ?? 'Pixels',
        background: preset.bg ?? 'White',
        customBgColor: preset.bgColor ?? '#FFFFFF',
        preset: preset.name,
    });
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
            settings={docSettings}
            setSettings={setDocSettings}
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
      <div className="bg-[#2D2D2D] w-full max-w-5xl h-[80vh] max-h-[700px] rounded-xl shadow-2xl flex overflow-hidden" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10" title="Close" aria-label="Close">
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
            <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100">Quick start</h2>
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
        className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
            isActive ? 'bg-gray-700/50 text-white' : 'text-gray-400 hover:text-white'
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

    const tabs = ['Recent', 'Saved', 'Photo', 'Print', 'Art & Illustration', 'Web', 'Mobile', 'Film & Video'];

    return (
        <div>
            <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100 mb-4">Create a blank document</h2>
            <div className="flex border-b border-gray-700 mb-6">
                <TabButton label="Recent" isActive={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
                <TabButton label="Saved" isActive={activeTab === 'saved'} onClick={() => setActiveTab('saved')} />
                {tabs.slice(2).map(tab => (
                    <TabButton key={tab} label={tab} isActive={false} onClick={() => alert(`${tab} presets coming soon!`)} />
                ))}
            </div>
            {activeTab === 'recent' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {defaultPresets.map(p => (
                        <button key={p.name} onClick={() => onPresetSelect(p)} className="aspect-[4/3] bg-gray-800/50 border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors">
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
                                <button onClick={() => onPresetSelect(p)} className="w-full h-full border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                                    <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                                    <p className="font-semibold text-gray-200 truncate w-full">{p.name}</p>
                                    <p className="text-sm text-gray-400">{p.w} x {p.h} {p.units}</p>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingPresetName(p.name); }} 
                                    className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                                    aria-label={`Delete preset ${p.name}`}
                                    title={`Delete preset ${p.name}`}
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

const CustomDocumentContent: React.FC<{ settings: any, setSettings: any, onCreate: () => void, onSavePreset: (name: string) => void }> = ({ settings, setSettings, onCreate, onSavePreset }) => {
  const { name, width, height, units, resolution, resolutionUnit, background, customBgColor, preset } = settings;
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
  const aspectRatioRef = useRef(width / height);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = { ...prev, [key]: value };
      if (key !== 'preset' && prev.preset !== 'Custom') {
        newSettings.preset = 'Custom';
      }
      return newSettings;
    });
  };
  
  const handlePresetChange = (presetName: string) => {
    if (presetName === 'Custom') {
        updateSetting('preset', 'Custom');
        return;
    }
    const selected = defaultPresets.find(p => p.name === presetName);
    if (selected) {
        setSettings({
            ...settings,
            name: selected.name,
            width: selected.w,
            height: selected.h,
            resolution: selected.res ?? 72,
            units: selected.units ?? 'Pixels',
            background: selected.bg ?? 'White',
            customBgColor: selected.bgColor ?? '#FFFFFF',
            preset: selected.name,
        });
    }
  };
  
  const presetOptions = [
    { value: 'Custom', label: 'Custom' },
    ...defaultPresets.map(p => ({ value: p.name, label: p.name })),
  ];
  const filteredPresetOptions = preset === 'Custom' 
    ? presetOptions 
    : presetOptions.filter(p => p.value !== 'Custom');
  
  const unitOptions = ['Pixels', 'Inches', 'Centimeters', 'Millimeters', 'Points', 'Picas'].map(u => ({ value: u, label: u }));
  const resolutionUnitOptions = [{ value: 'ppi', label: 'Pixels/Inch' }, { value: 'ppcm', label: 'Pixels/cm' }];
  const backgroundOptions = ['White', 'Black', 'Transparent', 'Custom'].map(b => ({ value: b, label: b }));

  const handleInitiateSave = () => {
    const presetName = prompt('Enter a name for your preset:', name);
    if (presetName) {
      onSavePreset(presetName);
    }
  };

  const toggleLock = () => {
    if (!isAspectRatioLocked) {
        if (width > 0 && height > 0) {
            aspectRatioRef.current = width / height;
        }
    }
    setIsAspectRatioLocked(prev => !prev);
  };

  const handleWidthChange = (newWidthValue: string) => {
    const newWidth = parseInt(newWidthValue, 10) || 0;
    updateSetting('width', newWidth);
    if (isAspectRatioLocked && aspectRatioRef.current !== 0) {
      const newHeight = Math.round(newWidth / aspectRatioRef.current);
      if (settings.height !== newHeight) {
          updateSetting('height', newHeight);
      }
    }
  };
  const handleHeightChange = (newHeightValue: string) => {
    const newHeight = parseInt(newHeightValue, 10) || 0;
    updateSetting('height', newHeight);
    if (isAspectRatioLocked) {
      const newWidth = Math.round(newHeight * aspectRatioRef.current);
      if (settings.width !== newWidth) {
          updateSetting('width', newWidth);
      }
    }
  };
  
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
      const currentOrientation = width >= height ? 'landscape' : 'portrait';
      if (newOrientation !== currentOrientation && width > 0 && height > 0) {
          const oldWidth = width;
          updateSetting('width', height);
          updateSetting('height', oldWidth);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const orientation = width >= height ? 'landscape' : 'portrait';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 pr-4 overflow-y-auto">
        <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100 mb-6">Create a custom blank document</h2>
        <div className="space-y-5 max-w-lg">
          <div>
            <label htmlFor="docName" className="block text-sm font-medium text-gray-400 mb-1">Document name <span className="text-red-400">*</span></label>
            <div className="relative">
              <Input id="docName" value={name} onChange={e => updateSetting('name', e.target.value)} />
               <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <button onClick={handleInitiateSave} title="Save Preset" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors" aria-label="Save preset">
                      <Icon type="download" />
                  </button>
              </div>
            </div>
          </div>
          
          <Select label="Preset" options={filteredPresetOptions} value={preset} onChange={handlePresetChange} />
  
          <div className="grid grid-cols-2 gap-x-6 items-start">
            {/* Left Column for Width/Height/Lock */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 space-y-2">
                <Input label="Width" type="number" value={width} onChange={e => handleWidthChange(e.target.value)} />
                <Input label="Height" type="number" value={height} onChange={e => handleHeightChange(e.target.value)} />
              </div>
              <div className="pt-7">
                <button onClick={toggleLock} title={isAspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"} className="p-2 rounded-md text-gray-500 hover:bg-gray-700 hover:text-white transition-colors">
                  <Icon type={isAspectRatioLocked ? 'lock' : 'unlock'} className="w-5 h-5"/>
                </button>
              </div>
            </div>

            {/* Right Column for Units/Orientation */}
            <div className="space-y-5">
              <Select label="Units" options={unitOptions} value={units} onChange={val => updateSetting('units', val)} />
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Orientation</label>
                <div className="flex space-x-2">
                    <button onClick={() => handleOrientationChange('portrait')} className={`p-2 rounded-md transition-colors ${orientation === 'portrait' ? 'bg-gray-500 text-white' : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700'}`}><Icon type="orientation-portrait"/></button>
                    <button onClick={() => handleOrientationChange('landscape')} className={`p-2 rounded-md transition-colors ${orientation === 'landscape' ? 'bg-gray-500 text-white' : 'bg-gray-800/50 border border-gray-600 hover:bg-gray-700'}`}><Icon type="orientation-landscape"/></button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6">
              <Input label="Resolution" type="number" value={resolution} onChange={e => updateSetting('resolution', parseInt(e.target.value))} />
              <Select label="&nbsp;" options={resolutionUnitOptions} value={resolutionUnit} onChange={val => updateSetting('resolutionUnit', val)} />
          </div>
  
          <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Select label="Background contents" options={backgroundOptions} value={background} onChange={val => updateSetting('background', val)} />
              </div>
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => background === 'Custom' && setIsColorPickerOpen(p => !p)}
                  className="w-10 h-10 p-0 border border-gray-600 rounded-md cursor-pointer disabled:cursor-not-allowed"
                  disabled={background !== 'Custom'}
                  style={{ backgroundColor: background === 'White' ? '#FFFFFF' : background === 'Black' ? '#000000' : background === 'Transparent' ? 'transparent' : customBgColor, backgroundImage: background === 'Transparent' ? `repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)` : 'none', backgroundSize: '10px 10px'}}
                />
                {isColorPickerOpen && background === 'Custom' && (
                  <ColorPicker
                    color={customBgColor}
                    onChange={color => updateSetting('customBgColor', color)}
                    onClose={() => setIsColorPickerOpen(false)}
                  />
                )}
              </div>
           </div>
          
          <div>
              <p className="text-sm text-gray-500">Color mode</p>
              <p className="text-sm font-medium text-gray-300">RGB 8 bit</p>
          </div>
  
        </div>
      </div>
      <div className="flex justify-end pt-6 border-t border-gray-700/50">
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-8 rounded-md transition-colors">Create</button>
      </div>
    </div>
  );
};

const Input: React.FC<{label?: string, value: any, onChange: any, type?: string, id?: string, autoFocus?: boolean, onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void}> = ({ label, ...props }) => (
    <div className="w-full">
        {label && <label htmlFor={props.id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            <input 
                {...props}
                className="w-full p-2 bg-[#1E1E1E] border border-gray-700 rounded-md focus:bg-gray-900/0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
        </div>
    </div>
);


export default CreateModal;
