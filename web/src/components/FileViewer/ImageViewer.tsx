import { useState, useRef, useEffect } from 'react';
import { MdZoomIn, MdZoomOut, MdRotateRight, MdRotateLeft, MdFlip, MdPanTool } from 'react-icons/md';
import { FiMaximize2 } from 'react-icons/fi';
import { BsZoomIn } from 'react-icons/bs';

interface ImageViewerProps {
  objectUrl: string;
  fileName: string;
}

type ToolMode = 'zoom' | 'pan';

const ImageViewer = ({ objectUrl, fileName }: ImageViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [mode, setMode] = useState<ToolMode>('pan');
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        switch(e.key.toLowerCase()) {
          case '0': setZoom(1); setPos({ x: 0, y: 0 }); break;
          case 'r': setRotation(r => (r + 90) % 360); break;
          case 'x': setFlipX(f => !f); break;
          case 'y': setFlipY(f => !f); break;
        }
      } else {
        switch(e.key.toLowerCase()) {
          case 'r': setZoom(1); setRotation(0); setFlipX(false); setFlipY(false); setPos({ x: 0, y: 0 }); setMode('pan'); break;
          case ' ': e.preventDefault(); setMode(m => m === 'zoom' ? 'pan' : 'zoom'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setOrigin({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100
      });
    }
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(z + delta, 0.5), 5));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (mode !== 'zoom' || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
    
    if (e.type === 'click') {
      setZoom(z => Math.min(z + 0.5, 5));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode !== 'zoom' || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
    
    setZoom(z => Math.max(z - 0.5, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || mode === 'pan') {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const transformStyle = {
    transform: `translate(${pos.x}px, ${pos.y}px) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1}) rotate(${rotation}deg) scale(${zoom})`,
    transformOrigin: `${origin.x}% ${origin.y}%`,
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    cursor: isDragging ? 'grabbing' : mode === 'zoom' ? 'zoom-in' : 'grab'
  };

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-700 rounded-lg p-1 border border-gray-600">
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-gray-600 rounded-lg" title="Zoom Out"> <MdZoomOut size={18} /></button>
          <span className="text-white text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 hover:bg-gray-600 rounded-lg" title="Zoom In"><MdZoomIn size={18} /></button>
          <button onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }} className="p-2 hover:bg-gray-600 rounded-lg ml-1" title="Reset Zoom"><FiMaximize2 size={16} /></button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <div className="flex items-center gap-1">
          <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="p-2 hover:bg-gray-600 rounded-lg" title="Rotate Left"><MdRotateLeft size={18} /></button>
          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 hover:bg-gray-600 rounded-lg" title="Rotate Right (Ctrl+R)"><MdRotateRight size={18} /></button>
          <button onClick={() => setFlipX(f => !f)} className={`p-2 rounded-lg ${flipX ? 'bg-sky-500 text-white' : 'hover:bg-gray-600'}`} title="Flip X (Ctrl+X)"><MdFlip size={18} style={{ transform: 'rotate(90deg)' }} /></button>
          <button onClick={() => setFlipY(f => !f)} className={`p-2 rounded-lg ${flipY ? 'bg-sky-500 text-white' : 'hover:bg-gray-600'}`} title="Flip Y (Ctrl+Y)"><MdFlip size={18} /></button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <div className="flex items-center gap-1">
          <button onClick={() => setMode('zoom')} className={`p-2 rounded-lg ${mode === 'zoom' ? 'bg-sky-500 text-white' : 'hover:bg-gray-600'}`} title="Zoom Mode (Space)"><BsZoomIn size={16} /></button>
          <button onClick={() => setMode('pan')} className={`p-2 rounded-lg ${mode === 'pan' ? 'bg-sky-500 text-white' : 'hover:bg-gray-600'}`} title="Pan Mode (Space)"><MdPanTool size={16} /></button>
        </div>

        <div className="w-px h-6 bg-gray-600" />

        <button onClick={() => { setZoom(1); setRotation(0); setFlipX(false); setFlipY(false); setPos({ x: 0, y: 0 }); setMode('pan'); }} className="p-2 hover:bg-gray-600 rounded-lg" title="Reset All (R)">↺</button>

        <div className="text-xs text-gray-400 ml-2 hidden md:block">
          {mode === 'zoom' ? '🖱️ Scroll Mode' : '🖱️ Drag mode'}
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden bg-gray-900 rounded-lg border border-gray-600 relative select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <img
          ref={imgRef}
          src={objectUrl}
          alt={fileName}
          onMouseDown={handleMouseDown}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            ...transformStyle,
            maxHeight: 'calc(85vh - 180px)',
          }}
          draggable={false}
        />
        
        <div className="absolute bottom-2 left-2 bg-black/50 text-white/70 px-2 py-1 rounded text-xs backdrop-blur-sm">
          {Math.round(zoom * 100)}% {rotation !== 0 && ` • ${rotation}°`}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;