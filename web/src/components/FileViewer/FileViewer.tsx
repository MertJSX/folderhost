import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { IoMdClose } from 'react-icons/io';
import { MdFilePresent } from 'react-icons/md';
import { FaMusic } from "react-icons/fa";
import ImageViewer from './ImageViewer';

interface FileViewerProps {
  filePath: string | null;
  onClose?: () => void;
}

const FileViewer = ({ filePath, onClose }: FileViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    contentType: string;
    fileName: string;
    directUrl: string;
  } | null>(null);
  
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!filePath) return;

    let isMounted = true;

    const loadFileInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        if (previousUrlRef.current) {
          URL.revokeObjectURL(previousUrlRef.current);
          previousUrlRef.current = null;
        }

        const baseURL = axiosInstance.defaults.baseURL || '';
        const cleanPath = filePath.slice(1);
        
        const timestamp = Date.now();
        const directUrl = `${baseURL}/raw/${encodeURIComponent(cleanPath)}?_t=${timestamp}`;
        
        const headResponse = await axiosInstance.head(`/raw/${encodeURIComponent(cleanPath)}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        const contentType = headResponse.headers['content-type'];
        const contentDisposition = headResponse.headers['content-disposition'];
        
        if (contentType === 'text/html') {
          throw new Error('Server returned HTML instead of file. Check if file exists and permissions.');
        }
        
        let fileName = filePath.split('/').pop() || 'file';
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) fileName = match[1].replace(/['"]/g, '');
        }

        if (!isMounted) return;
        
        setFileData({
          contentType,
          fileName,
          directUrl
        });
        
        previousUrlRef.current = directUrl;
        
      } catch (err) {
        if (isMounted) {
          console.error('File loading error:', err);
          setError('Failed to load file info. Please check your permissions or try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFileInfo();

    return () => {
      isMounted = false;
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, [filePath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!filePath) return null;

  const fileName = fileData?.fileName ?? filePath.split('/').pop() ?? 'File';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-sky-500 rounded-full animate-spin" />
          <span className="text-sm">Loading file info...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-400">
          <MdFilePresent size={48} className="opacity-40" />
          <p className="text-sm text-red-400">{error}</p>
          <button 
            onClick={() => {
              setFileData(null);
              setError(null);
              const cleanPath = filePath.slice(1);
              const timestamp = Date.now();
              const newUrl = `${axiosInstance.defaults.baseURL || ''}/raw/${encodeURIComponent(cleanPath)}?_t=${timestamp}`;
              window.open(newUrl, '_blank');
            }}
            className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white text-sm"
          >
            Try opening directly
          </button>
        </div>
      );
    }

    if (!fileData) return null;

    const { contentType, directUrl } = fileData;

    // IMAGE
    if (contentType.startsWith('image/')) {
      return <ImageViewer objectUrl={directUrl} fileName={fileName} />;
    }

    // PDF
    if (contentType === 'application/pdf') {
      return (
        <embed
          key={directUrl}
          src={directUrl + `#toolbar=1&navpanes=1&scrollbar=0&_t=${Date.now()}`}
          type="application/pdf"
          title={fileName}
          className="flex-1 w-full border border-gray-600 bg-gray-900"
          style={{ minHeight: 0 }}
        />
      );
    }

    // VIDEO
    if (contentType.startsWith('video/')) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-600 p-4">
          <video
            key={directUrl}
            controls
            className="max-w-full rounded"
            style={{ maxHeight: '60vh' }}
            preload="metadata"
          >
            <source src={directUrl} type={contentType} />
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    // AUDIO
    if (contentType.startsWith('audio/')) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-900 rounded-lg border border-gray-600 p-8">
          <div className="p-6 bg-gray-800 rounded-full border-2 border-gray-600">
            <FaMusic size={48} className="text-sky-400" />
          </div>
          <p className="text-gray-300 font-medium truncate max-w-xs text-center">{fileName}</p>
          <audio 
            key={directUrl}
            controls 
            className="w-full max-w-md"
            preload="metadata"
          >
            <source src={directUrl} type={contentType === 'audio/opus' ? 'audio/opus' : contentType} />
            <source src={directUrl} type="audio/webm" />
            <source src={directUrl} type="audio/ogg" />
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }

    // UNSUPPORTED
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-900 rounded-lg border border-gray-600 p-8 text-gray-400">
        <MdFilePresent size={48} className="opacity-40" />
        <p className="text-sm text-center">
          File type <span className="text-gray-300 font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">{contentType}</span> cannot be previewed in the browser.
        </p>
        <button 
          onClick={() => window.open(directUrl, '_blank')}
          className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg text-white text-sm"
        >
          Download or Open
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="flex flex-col bg-gray-800 rounded-xl shadow-2xl w-full max-w-[100vw] mx-auto"
        style={{ height: '95vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-600 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-sky-500 rounded-lg flex-shrink-0">
              <MdFilePresent size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-bold text-base truncate">{fileName}</h2>
              <p className="text-gray-400 text-xs truncate">{filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              onClick={onClose}
              className="flex items-center justify-center p-2 bg-gray-700 hover:bg-red-600 text-white rounded-lg transition-colors border-2 border-gray-700 hover:border-red-600"
              title="Close (Esc)"
            >
              <IoMdClose size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-0 gap-4 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;