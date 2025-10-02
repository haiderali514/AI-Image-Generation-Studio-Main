
import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';
import ColorPicker from '../ui/ColorPicker';

interface ColorPanelProps {
  foregroundColor: string;
  backgroundColor: string;
  onSetForegroundColor: (color: string) => void;
  onSetBackgroundColor: (color: string) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
}

const ColorPanel: React.FC<ColorPanelProps> = (props) => {
  const { foregroundColor, backgroundColor, onSetForegroundColor, onSetBackgroundColor, onSwapColors, onResetColors } = props;
  const [activePicker, setActivePicker] = useState<'fg' | 'bg' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (color: string) => {
    if (activePicker === 'fg') {
      onSetForegroundColor(color);
    } else if (activePicker === 'bg') {
      onSetBackgroundColor(color);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <div className="relative w-12 h-12">
        <button
          onClick={() => setActivePicker('bg')}
          title={`Background Color: ${backgroundColor}`}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-md border-2 border-gray-500"
          style={{ backgroundColor: backgroundColor }}
        />
        <button
          onClick={() => setActivePicker('fg')}
          title={`Foreground Color: ${foregroundColor}`}
          className="absolute top-0 left-0 w-8 h-8 rounded-md border-2 border-gray-500"
          style={{ backgroundColor: foregroundColor }}
        />
        <button onClick={onSwapColors} title="Swap Colors (X)" className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors">
            <Icon type="swap" />
        </button>
        <button onClick={onResetColors} title="Default Colors (D)" className="absolute bottom-0 left-0 text-gray-400 hover:text-white transition-colors">
            <Icon type="reset-colors" />
        </button>
      </div>

      {activePicker && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30">
            <ColorPicker
                color={activePicker === 'fg' ? foregroundColor : backgroundColor}
                onChange={handleColorChange}
                onClose={() => setActivePicker(null)}
            />
        </div>
      )}
    </div>
  );
};

export default ColorPanel;
