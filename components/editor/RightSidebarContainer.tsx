
import React from 'react';
import { EditorTool, Layer, BrushShape, AnySubTool, HistoryState } from '../../types';
import LayersPanel from './LayersPanel';
import HistoryPanel from './HistoryPanel';
import CommentsPanel from './CommentsPanel';
import Icon from '../ui/Icon';

interface RightSidebarContainerProps {
  // Layers Panel Props
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: () => void;
  onUpdateLayerProps: (id: string, props: Partial<Layer>, action: string) => void;
  onUpdateLayerPropsPreview: (id: string, props: Partial<Layer>) => void;
  onDuplicateLayer: () => void;
  onMergeDown: () => void;
  onConvertBackground: () => void;
  isLayersPanelOpen: boolean;
  toggleLayersPanel: () => void;
  layersPanelHeight: number;
  onLayersPanelHeightChange: (height: number) => void;

  // History Panel Props
  isHistoryPanelOpen: boolean;
  toggleHistoryPanel: () => void;
  historyPanelHeight: number;
  onHistoryPanelHeightChange: (height: number) => void;
  history: HistoryState[];
  historyIndex: number;
  onJumpToHistoryState: (index: number) => void;
  
  // Comments Panel Props
  isCommentsPanelOpen: boolean;
  toggleCommentsPanel: () => void;
  commentsPanelHeight: number;
  onCommentsPanelHeightChange: (height: number) => void;
}

const PanelToggleButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button 
        onClick={onClick} 
        title={label}
        className={`p-3 rounded-md transition-colors ${isActive ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400'}`}
    >
        {icon}
    </button>
);

const RightSidebarContainer: React.FC<RightSidebarContainerProps> = (props) => {
  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full overflow-y-auto">
        {props.isLayersPanelOpen && (
          <LayersPanel
            layers={props.layers}
            activeLayerId={props.activeLayerId}
            onSelectLayer={props.onSelectLayer}
            onAddLayer={props.onAddLayer}
            onDeleteLayer={props.onDeleteLayer}
            onUpdateLayerProps={props.onUpdateLayerProps}
            onUpdateLayerPropsPreview={props.onUpdateLayerPropsPreview}
            onDuplicateLayer={props.onDuplicateLayer}
            onMergeDown={props.onMergeDown}
            onConvertBackground={props.onConvertBackground}
            onClose={props.toggleLayersPanel}
            height={props.layersPanelHeight}
            onHeightChange={props.onLayersPanelHeightChange}
          />
        )}
        {props.isHistoryPanelOpen && (
            <HistoryPanel 
                history={props.history}
                currentIndex={props.historyIndex}
                onJumpToState={props.onJumpToHistoryState}
                onClose={props.toggleHistoryPanel}
                height={props.historyPanelHeight}
                onHeightChange={props.onHistoryPanelHeightChange}
            />
        )}
        {props.isCommentsPanelOpen && (
            <CommentsPanel 
              onClose={props.toggleCommentsPanel}
              height={props.commentsPanelHeight}
              onHeightChange={props.onCommentsPanelHeightChange}
            />
        )}
      </div>
      <div className="w-12 bg-[#1E1E1E] border-l border-black/20 p-2 flex flex-col items-center space-y-2">
        <PanelToggleButton label="Layers" icon={<Icon type="layers" />} isActive={props.isLayersPanelOpen} onClick={props.toggleLayersPanel} />
        <PanelToggleButton label="History" icon={<Icon type="history" />} isActive={props.isHistoryPanelOpen} onClick={props.toggleHistoryPanel} />
        <PanelToggleButton label="Comments" icon={<Icon type="comment" />} isActive={props.isCommentsPanelOpen} onClick={props.toggleCommentsPanel} />
      </div>
    </div>
  );
};

export default RightSidebarContainer;