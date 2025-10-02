
import React from 'react';
import Icon from '../ui/Icon';
import { EditorTool, BrushShape, TextAlign } from '../../types';

interface TopToolbarProps {
    activeTool: EditorTool;
    // Brush & Eraser
    brushSize: number;
    setBrushSize: (size: number) => void;
    brushHardness: number;
    setBrushHardness: (hardness: number) => void;
    brushOpacity: number;
    setBrushOpacity: (opacity: number) => void;
    brushShape: BrushShape;
    setBrushShape: (shape: BrushShape) => void;
    // Text
    fontFamily: string;
    setFontFamily: (font: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    textAlign: TextAlign;
    setTextAlign: (align: TextAlign) => void;
}

const BrushEraserOptions: React.FC<Omit<TopToolbarProps, 'activeTool' | 'fontFamily' | 'setFontFamily' | 'fontSize' | 'setFontSize' | 'textAlign' | 'setTextAlign'>> = (props) => (
    <>
        {/* Brush Size */}
        <div className="flex items-center space-x-2 w-48">
            <label htmlFor="brushSize" className="text-sm text-gray-400 whitespace-nowrap">Size:</label>
            <input
                type="range" id="brushSize" min="1" max="500" value={props.brushSize}
                onChange={e => props.setBrushSize(parseInt(e.target.value))}
                className="w-full accent-indigo-500" title={`Brush Size: ${props.brushSize}px`}
            />
            <span className="text-sm text-gray-300 w-10 text-right">{props.brushSize}px</span>
        </div>
        <div className="w-px h-6 bg-gray-600" />
        {/* Brush Hardness */}
        <div className="flex items-center space-x-2 w-48">
            <label htmlFor="brushHardness" className="text-sm text-gray-400 whitespace-nowrap">Hardness:</label>
            <input
                type="range" id="brushHardness" min="0" max="1" step="0.01" value={props.brushHardness}
                onChange={e => props.setBrushHardness(parseFloat(e.target.value))}
                className="w-full accent-indigo-500" title={`Brush Hardness: ${Math.round(props.brushHardness * 100)}%`}
            />
            <span className="text-sm text-gray-300 w-10 text-right">{Math.round(props.brushHardness * 100)}%</span>
        </div>
        <div className="w-px h-6 bg-gray-600" />
         {/* Brush Opacity */}
        <div className="flex items-center space-x-2 w-48">
            <label htmlFor="brushOpacity" className="text-sm text-gray-400 whitespace-nowrap">Opacity:</label>
            <input
                type="range" id="brushOpacity" min="0.01" max="1" step="0.01" value={props.brushOpacity}
                onChange={e => props.setBrushOpacity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500" title={`Opacity: ${Math.round(props.brushOpacity * 100)}%`}
            />
            <span className="text-sm text-gray-300 w-10 text-right">{Math.round(props.brushOpacity * 100)}%</span>
        </div>
        <div className="w-px h-6 bg-gray-600" />
        {/* Brush Shape */}
        <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Tip:</label>
            <button
                onClick={() => props.setBrushShape('round')}
                className={`p-1.5 rounded-md transition-colors ${props.brushShape === 'round' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                title="Round brush tip"
            >
                <Icon type="brush-round" />
            </button>
            <button
                onClick={() => props.setBrushShape('square')}
                className={`p-1.5 rounded-md transition-colors ${props.brushShape === 'square' ? 'bg-indigo-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                title="Square brush tip"
            >
                <Icon type="brush-square" />
            </button>
        </div>
    </>
);

const TextOptions: React.FC<Pick<TopToolbarProps, 'fontFamily' | 'setFontFamily' | 'fontSize' | 'setFontSize' | 'textAlign' | 'setTextAlign'>> = (props) => (
    <>
        <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Font:</label>
            <select
                value={props.fontFamily}
                onChange={e => props.setFontFamily(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option>sans-serif</option>
                <option>serif</option>
                <option>monospace</option>
                <option>cursive</option>
            </select>
        </div>
         <div className="w-px h-6 bg-gray-600" />
        <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Size:</label>
            <input
                type="number"
                value={props.fontSize}
                onChange={e => props.setFontSize(parseInt(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm w-20 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
        <div className="w-px h-6 bg-gray-600" />
        <div className="flex items-center space-x-1 bg-gray-700 p-0.5 rounded-md">
            <button onClick={() => props.setTextAlign('left')} title="Align Left" className={`p-1.5 rounded ${props.textAlign === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><Icon type="align-left" /></button>
            <button onClick={() => props.setTextAlign('center')} title="Align Center" className={`p-1.5 rounded ${props.textAlign === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><Icon type="align-center" /></button>
            <button onClick={() => props.setTextAlign('right')} title="Align Right" className={`p-1.5 rounded ${props.textAlign === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}><Icon type="align-right" /></button>
        </div>
    </>
);

const MoveOptions: React.FC = () => (
    <>
        <label className="text-sm text-gray-400">Align:</label>
        <div className="flex items-center space-x-1 bg-gray-700 p-0.5 rounded-md">
            <button title="Align Left Edges" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-left-2" /></button>
            <button title="Align Horizontal Centers" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-center-horizontal-2" /></button>
            <button title="Align Right Edges" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-right-2" /></button>
        </div>
        <div className="w-px h-6 bg-gray-600" />
        <div className="flex items-center space-x-1 bg-gray-700 p-0.5 rounded-md">
            <button title="Align Top Edges" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-top-2" /></button>
            <button title="Align Vertical Centers" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-center-vertical-2" /></button>
            <button title="Align Bottom Edges" className="p-1.5 rounded hover:bg-gray-600"><Icon type="align-bottom-2" /></button>
        </div>
    </>
);

const TopToolbar: React.FC<TopToolbarProps> = (props) => {
    
    const renderContent = () => {
        switch(props.activeTool) {
            case EditorTool.BRUSH:
            case EditorTool.ERASER:
                return <BrushEraserOptions {...props} />;
            case EditorTool.TEXT:
                return <TextOptions {...props} />;
            case EditorTool.MOVE:
                return <MoveOptions />;
            default:
                return null;
        }
    }

    const content = renderContent();
    if (!content) {
        return <div className="h-12 bg-[#2D2D2D] border-b border-black/20 flex-shrink-0 z-10" />;
    }

    return (
        <div className="h-12 bg-[#2D2D2D] border-b border-black/20 flex-shrink-0 flex items-center px-4 space-x-4 z-10">
            {content}
        </div>
    );
};

export default TopToolbar;
