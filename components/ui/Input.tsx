import React from 'react';

/**
 * @file This file defines a reusable, styled input field component.
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * A reusable styled input component for forms.
 * @param {InputProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered input component.
 */
const Input: React.FC<InputProps> = ({ label, ...props }) => (
    <div className="w-full">
        {label && <label htmlFor={props.id} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>}
        <div className="relative">
            <input 
                {...props}
                className="w-full p-2 bg-[#1E1E1E] border border-gray-700 rounded-md focus:bg-gray-900/0 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-200"
            />
        </div>
    </div>
);

export default Input;
