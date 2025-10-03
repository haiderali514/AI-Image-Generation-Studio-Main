
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const baseClasses = "w-full flex items-center justify-between p-2 bg-[#1E1E1E] border border-gray-700 rounded-md text-left";
  const activeClasses = "focus:bg-gray-900/0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none";
  const disabledClasses = "disabled:bg-gray-800/50 disabled:cursor-not-allowed";

  return (
    <div className="relative w-full" ref={selectRef}>
      {label && <label className={`block text-sm font-medium mb-1 ${disabled ? 'text-gray-500' : 'text-gray-400'}`}>{label}</label>}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
        disabled={disabled}
      >
        <span className={disabled ? 'text-gray-500' : 'text-gray-200'}>{selectedOption?.label}</span>
        <Icon type="chevron-down" className={`text-gray-400 ${disabled ? 'text-gray-600' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-[#3a3a3a] border border-black/50 rounded-md shadow-lg py-1">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full text-left px-3 py-2 text-sm flex items-center text-gray-200 hover:bg-blue-600"
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {value === option.value && <Icon type="check" />}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
