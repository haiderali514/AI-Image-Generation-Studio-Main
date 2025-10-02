
import React from 'react';
import Icon from '../ui/Icon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="bg-[#2D2D2D] w-full max-w-md rounded-xl shadow-2xl p-6" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="flex justify-between items-center mb-4">
          <h2 id="confirm-modal-title" className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" title="Close">
            <Icon type="close" />
          </button>
        </div>
        <div className="text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-600 text-gray-100 hover:bg-gray-500 rounded-md font-medium">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md font-medium">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
