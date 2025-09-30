
import React, { useState, useEffect, useRef } from 'react';

// Color conversion utilities
const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  s /= 100; v /= 100;
  let i = Math.floor((h / 360) * 6);
  let f = (h / 360) * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  let r=0, g=0, b=0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
    const { r, g, b } = hexToRgb(color);
    const { h, s, v } = rgbToHsv(r, g, b);
    
    const [hsv, setHsv] = useState({ h, s, v });

    const saturationRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
        onChange(rgbToHex(r, g, b));
    }, [hsv, onChange]);

    const handleSaturationMove = (e: React.MouseEvent) => {
        if (e.buttons !== 1) return;
        const satRect = saturationRef.current!.getBoundingClientRect();
        let x = Math.max(0, Math.min(e.clientX - satRect.left, satRect.width));
        let y = Math.max(0, Math.min(e.clientY - satRect.top, satRect.height));
        setHsv(prev => ({ ...prev, s: (x / satRect.width) * 100, v: 100 - (y / satRect.height) * 100 }));
    };

    const handleHueMove = (e: React.MouseEvent) => {
        if (e.buttons !== 1) return;
        const hueRect = hueRef.current!.getBoundingClientRect();
        let y = Math.max(0, Math.min(e.clientY - hueRect.top, hueRect.height));
        setHsv(prev => ({ ...prev, h: (y / hueRect.height) * 360 }));
    };

    const { r: currentR, g: currentG, b: currentB } = hsvToRgb(hsv.h, hsv.s, hsv.v);

    return (
        <div className="absolute z-20 top-full mt-2 left-0 w-64 bg-[#252525] p-3 rounded-lg shadow-2xl border border-black/30">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Select a color</h3>
            <div
                ref={saturationRef}
                onMouseDown={handleSaturationMove}
                onMouseMove={handleSaturationMove}
                className="relative w-full h-32 rounded-md cursor-crosshair"
                style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div
                    className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
                />
            </div>
            <div className="flex items-center space-x-2 mt-3">
                <div className="w-10 h-10 rounded-full border-2 border-gray-500" style={{ backgroundColor: color }}/>
                <div
                    ref={hueRef}
                    onMouseDown={handleHueMove}
                    onMouseMove={handleHueMove}
                    className="relative w-4 h-32 rounded-full cursor-pointer"
                    style={{ background: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                >
                    <div
                        className="absolute w-full h-1 rounded-full bg-white/50 border border-white/80 transform -translate-y-1/2"
                        style={{ top: `${(hsv.h / 360) * 100}%` }}
                    />
                </div>
                 <div className="flex-1 space-y-1">
                    <div className="flex items-center bg-gray-700/50 rounded-md">
                        <span className="px-2 text-xs text-gray-400">HEX</span>
                        <input value={color} onChange={e => onChange(e.target.value)} className="w-full bg-transparent p-1 text-sm text-right rounded-md focus:outline-none"/>
                    </div>
                    <div className="flex items-center bg-gray-700/50 rounded-md">
                        <span className="px-2 text-xs text-gray-400">R</span>
                        <input type="number" min="0" max="255" value={currentR} onChange={e => setHsv(rgbToHsv(parseInt(e.target.value), currentG, currentB))} className="w-full bg-transparent p-1 text-sm text-right rounded-md focus:outline-none"/>
                    </div>
                     <div className="flex items-center bg-gray-700/50 rounded-md">
                        <span className="px-2 text-xs text-gray-400">G</span>
                        <input type="number" min="0" max="255" value={currentG} onChange={e => setHsv(rgbToHsv(currentR, parseInt(e.target.value), currentB))} className="w-full bg-transparent p-1 text-sm text-right rounded-md focus:outline-none"/>
                    </div>
                     <div className="flex items-center bg-gray-700/50 rounded-md">
                        <span className="px-2 text-xs text-gray-400">B</span>
                        <input type="number" min="0" max="255" value={currentB} onChange={e => setHsv(rgbToHsv(currentR, currentG, parseInt(e.target.value)))} className="w-full bg-transparent p-1 text-sm text-right rounded-md focus:outline-none"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorPicker;
