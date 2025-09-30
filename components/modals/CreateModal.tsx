
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tool, DocumentSettings } from '../../types';
import Icon from '../ui/Icon';
import ColorPicker from '../ui/ColorPicker';
import Input from '../ui/Input';
import { CustomPreset, Preset, mostUsedPresets, photoPresets, socialMediaPresets, filmAndVideoPresets, defaultPreset, getCustomPresets, saveCustomPreset, deleteCustomPreset, renameCustomPreset } from '../../utils/presets';
import CreateModalNav, { ModalView } from './create/CreateModalNav';
import QuickStartContent from './create/QuickStartContent';
import Select from '../ui/Select';


interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: DocumentSettings) => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [activeView, setActiveView] = useState<ModalView>('quickStart');
  
  // State for the custom document form
  const [docSettings, setDocSettings] = useState<DocumentSettings>({
    name: 'Untitled-1',
    width: defaultPreset.w,
    height: defaultPreset.h,
    units: defaultPreset.units ?? 'Pixels',
    resolution: defaultPreset.res ?? 72,
    resolutionUnit: 'ppi',
    background: defaultPreset.bg ?? 'White',
    customBgColor: '#FFFFFF',
  });
  
  // State for presets
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCustomPresets(getCustomPresets());
      setActiveView('quickStart');
    }
  }, [isOpen]);

  const handleSavePreset = (presetName: string): boolean => {
    const newPreset: CustomPreset = {
        name: presetName,
        w: docSettings.width,
        h: docSettings.height,
        res: docSettings.resolution,
        units: docSettings.units,
        bg: docSettings.background,
        bgColor: docSettings.customBgColor
    };
    const result = saveCustomPreset(newPreset);
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
    setCustomPresets(result.presets);
    return result.success;
  };

  const handleDeletePreset = (presetName: string) => {
      const updatedPresets = deleteCustomPreset(presetName);
      setCustomPresets(updatedPresets);
  };
  
  const handleRenamePreset = (oldName: string, newName: string): boolean => {
    const result = renameCustomPreset(oldName, newName);
    if (!result.success) {
      alert(result.message);
    }
    setCustomPresets(result.presets);
    return result.success;
  };

  const handleToolSelect = useCallback((tool: Tool) => {
    // This function is now primarily for quick-start tools that don't create a blank canvas
    // For now, we will just log it. A future implementation could open a specific panel.
    console.log("Selected tool:", tool);
    onClose();
  }, [onClose]);

  const handleImageUpload = useCallback(async (file: File) => {
    // A future implementation would open the editor with this image
    console.log("Uploaded file:", file.name);
    handleToolSelect(Tool.GENERATIVE_FILL);
  }, [handleToolSelect]);
  
  const handleCreateCustom = () => {
    onCreate(docSettings);
  };
  
  const handleSetPreset = (preset: Preset) => {
    setDocSettings({
        name: preset.name,
        width: preset.w,
        height: preset.h,
        resolution: preset.res ?? 72,
        resolutionUnit: 'ppi',
        units: preset.units ?? 'Pixels',
        background: preset.bg ?? 'White',
        customBgColor: preset.bgColor ?? '#FFFFFF',
    });
    setActiveView('customDoc');
  };

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeView) {
      case 'quickStart':
        return <QuickStartContent onUpload={handleImageUpload} onToolSelect={handleToolSelect} />;
      case 'blankDoc':
        return <BlankDocumentContent 
                    onPresetSelect={handleSetPreset} 
                    customPresets={customPresets} 
                    onDeletePreset={handleDeletePreset}
                    onRenamePreset={handleRenamePreset}
                />;
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
        
        <CreateModalNav activeView={activeView} setActiveView={setActiveView} />

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
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

const PresetGrid: React.FC<{
    presets: Preset[];
    onPresetSelect: (preset: any) => void;
}> = ({ presets, onPresetSelect }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {presets.map(p => (
            <button key={p.name} onClick={() => onPresetSelect(p)} className="aspect-[4/3] bg-gray-800/50 border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                <p className="font-semibold text-gray-200 w-full truncate">{p.name}</p>
                <p className="text-sm text-gray-400">{p.w} x {p.h} px</p>
            </button>
        ))}
    </div>
);

const BlankDocumentContent: React.FC<{
  onPresetSelect: (preset: any) => void;
  customPresets: CustomPreset[];
  onDeletePreset: (name: string) => void;
  onRenamePreset: (oldName: string, newName: string) => boolean;
}> = ({ onPresetSelect, customPresets, onDeletePreset, onRenamePreset }) => {
    type PresetTab = 'most used' | 'saved' | 'photo' | 'social media' | 'film & video';
    const [activeTab, setActiveTab] = useState<PresetTab>('most used');
    const [deletingPresetName, setDeletingPresetName] = useState<string | null>(null);
    const [renamingPresetName, setRenamingPresetName] = useState<string | null>(null);
    const [editedPresetName, setEditedPresetName] = useState('');

    const handleDeleteConfirm = (name: string) => {
        onDeletePreset(name);
        setDeletingPresetName(null);
    };
    
    const handleRenameStart = (preset: CustomPreset) => {
        setRenamingPresetName(preset.name);
        setEditedPresetName(preset.name);
        setDeletingPresetName(null); 
    };

    const handleRenameCancel = () => {
        setRenamingPresetName(null);
        setEditedPresetName('');
    };

    const handleRenameConfirm = () => {
        if (renamingPresetName) {
            const success = onRenamePreset(renamingPresetName, editedPresetName);
            if (success) {
                handleRenameCancel();
            }
        }
    };

    const tabConfig: {label: string, id: PresetTab}[] = [
      { label: 'Most Used', id: 'most used' },
      { label: 'Saved', id: 'saved' },
      { label: 'Photo', id: 'photo' },
      { label: 'Social Media', id: 'social media' },
      { label: 'Film & Video', id: 'film & video' },
    ];
    
    const presetData: Record<string, Preset[]> = {
        'most used': mostUsedPresets,
        'photo': photoPresets,
        'social media': socialMediaPresets,
        'film & video': filmAndVideoPresets,
    };

    return (
        <div>
            <h2 id="create-modal-title" className="text-2xl font-semibold text-gray-100 mb-4">Create a blank document</h2>
            <div className="flex border-b border-gray-700 mb-6">
                {tabConfig.map(tab => (
                    <TabButton 
                        key={tab.id} 
                        label={tab.label} 
                        isActive={activeTab === tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                    />
                ))}
            </div>

            {activeTab !== 'saved' && presetData[activeTab] && (
                <PresetGrid presets={presetData[activeTab]} onPresetSelect={onPresetSelect} />
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
                                {renamingPresetName === p.name ? (
                                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 space-y-3 transition-opacity">
                                        <h4 className="font-semibold text-white text-center">Rename Preset</h4>
                                        <Input 
                                            type="text" 
                                            value={editedPresetName} 
                                            onChange={(e) => setEditedPresetName(e.target.value)} 
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameConfirm();
                                                if (e.key === 'Escape') handleRenameCancel();
                                            }}
                                        />
                                        <div className="flex space-x-2">
                                            <button onClick={handleRenameCancel} className="px-3 py-1 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded font-medium">Cancel</button>
                                            <button onClick={handleRenameConfirm} className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded font-medium">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                <>
                                    <button onClick={() => onPresetSelect(p)} className="w-full h-full border-2 border-gray-700 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-4 transition-colors text-center">
                                        <Icon type="document" className="w-10 h-10 text-gray-500 mb-2"/>
                                        <p className="font-semibold text-gray-200 truncate w-full">{p.name}</p>
                                        <p className="text-sm text-gray-400">{p.w} x {p.h} {p.units}</p>
                                    </button>
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRenameStart(p); }} 
                                            className="p-1.5 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-blue-500/50 disabled:opacity-50"
                                            aria-label={`Rename preset ${p.name}`}
                                            title={`Rename preset ${p.name}`}
                                            disabled={!!deletingPresetName || !!renamingPresetName}
                                        >
                                            <Icon type="edit" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDeletingPresetName(p.name); }} 
                                            className="p-1.5 bg-gray-900/50 rounded-full text-gray-400 hover:text-white hover:bg-red-500/50 disabled:opacity-50"
                                            aria-label={`Delete preset ${p.name}`}
                                            title={`Delete preset ${p.name}`}
                                            disabled={!!deletingPresetName || !!renamingPresetName}
                                        >
                                            <Icon type="trash" />
                                        </button>
                                    </div>
                                    {deletingPresetName === p.name && (
                                        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 space-y-3 transition-opacity">
                                            <p className="font-semibold text-white text-center">Delete preset?</p>
                                            <div className="flex space-x-2">
                                                <button onClick={() => setDeletingPresetName(null)} className="px-3 py-1 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded font-medium">Cancel</button>
                                                <button onClick={() => handleDeleteConfirm(p.name)} className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-500 rounded font-medium">Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
};

const CustomDocumentContent: React.FC<{
  settings: DocumentSettings,
  setSettings: React.Dispatch<React.SetStateAction<DocumentSettings>>,
  onCreate: () => void,
  onSavePreset: (name: string) => boolean
}> = ({ settings, setSettings, onCreate, onSavePreset }) => {
  const { name, width, height, units, resolution, background, customBgColor } = settings;
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(false);
  const aspectRatioRef = useRef(width > 0 && height > 0 ? width / height : 1);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState(name);

  const updateSetting = (key: keyof DocumentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handlePresetChange = (presetName: string) => {
    const allPresets = [defaultPreset, ...mostUsedPresets, ...photoPresets, ...socialMediaPresets, ...filmAndVideoPresets];
    const selected = allPresets.find(p => p.name === presetName);
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
        });
    }
  };
  
  const allPresetsList = [defaultPreset, ...mostUsedPresets, ...photoPresets, ...socialMediaPresets, ...filmAndVideoPresets];
  const uniquePresets = allPresetsList.filter((p, i, a) => a.findIndex(t => t.name === p.name) === i);
  
  const presetOptions = uniquePresets.map(p => ({ value: p.name, label: p.name }));

  const unitOptions = ['Pixels', 'Inches', 'Centimeters', 'Millimeters', 'Points', 'Picas'].map(u => ({ value: u, label: u }));
  const resolutionUnitOptions = [{ value: 'ppi', label: 'Pixels/Inch' }, { value: 'ppcm', label: 'Pixels/cm' }];
  const backgroundOptions = ['White', 'Black', 'Transparent', 'Custom'].map(b => ({ value: b, label: b }));

  const handleInitiateSave = () => {
    setNewPresetName(name);
    setIsSavingPreset(true);
  };

  const handleConfirmSavePreset = () => {
    const success = onSavePreset(newPresetName);
    if (success) {
      setIsSavingPreset(false);
    }
  };

  const handleCancelSavePreset = () => {
    setIsSavingPreset(false);
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
    if (isAspectRatioLocked && aspectRatioRef.current && newWidth > 0) {
      const newHeight = Math.round(newWidth / aspectRatioRef.current);
      if (newHeight > 0) {
        updateSetting('height', newHeight);
      }
    }
  };
  const handleHeightChange = (newHeightValue: string) => {
    const newHeight = parseInt(newHeightValue, 10) || 0;
    updateSetting('height', newHeight);
    if (isAspectRatioLocked && aspectRatioRef.current && newHeight > 0) {
      const newWidth = Math.round(newHeight * aspectRatioRef.current);
      if (newWidth > 0) {
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
          if (isAspectRatioLocked) {
            aspectRatioRef.current = height / oldWidth;
          }
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
            {isSavingPreset ? (
              <div className="flex items-center space-x-2">
                <Input
                  id="presetName"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleConfirmSavePreset(); if (e.key === 'Escape') handleCancelSavePreset(); }}
                />
                <button onClick={handleConfirmSavePreset} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md font-medium whitespace-nowrap">Save Preset</button>
                <button onClick={handleCancelSavePreset} className="px-4 py-2 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded-md font-medium">Cancel</button>
              </div>
            ) : (
              <div className="relative">
                <Input id="docName" value={name} onChange={e => updateSetting('name', e.target.value)} />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <button onClick={handleInitiateSave} title="Save Preset" className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md transition-colors" aria-label="Save preset">
                        <Icon type="save" />
                    </button>
                </div>
              </div>
            )}
          </div>
          
          <Select label="Preset" options={presetOptions} value={settings.name} onChange={handlePresetChange} />
  
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
              <Select label="&nbsp;" options={resolutionUnitOptions} value={settings.resolutionUnit} onChange={val => updateSetting('resolutionUnit', val)} />
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

export default CreateModal;
