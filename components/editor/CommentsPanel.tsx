
import React, { useRef, useEffect } from 'react';
import Icon from '../ui/Icon';

interface CommentsPanelProps {
  onClose: () => void;
  height: number;
  onHeightChange: (height: number) => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({ onClose, height, onHeightChange }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = handleRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return;
    const onMouseDown = (e_down: MouseEvent) => {
        e_down.preventDefault();
        const startY = e_down.clientY;
        const startHeight = panel.getBoundingClientRect().height;
        const onMouseMove = (e_move: MouseEvent) => {
            const dy = e_move.clientY - startY;
            onHeightChange(Math.max(150, startHeight + dy));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', onMouseDown);
    return () => {
        if (handle) {
            handle.removeEventListener('mousedown', onMouseDown);
        }
    };
  }, [onHeightChange]);

  return (
    <div ref={panelRef} style={{ height: `${height}px` }} className="bg-[#2D2D2D] w-[300px] flex flex-col border-l border-black/20">
      <header className="h-10 px-2.5 flex justify-between items-center border-b border-black/20 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-base">Comments</h2>
          <Icon type="info" className="text-gray-500" />
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10" title="Close Panel">
          <Icon type="close" />
        </button>
      </header>
      <div className="flex-1 p-4 text-center text-gray-500">
        <p>Comments and collaboration features are coming soon.</p>
      </div>
      <div ref={handleRef} className="h-1.5 w-full cursor-ns-resize bg-black/20 hover:bg-blue-600 transition-colors flex-shrink-0" />
    </div>
  );
};

export default CommentsPanel;
