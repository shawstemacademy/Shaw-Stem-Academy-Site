import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Image as ImageIcon, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { downloadImage } from '../../lib/downloadHelper';

interface ImageUploadInputProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'wide' | 'banner' | 'auto';
  maxDimension?: number;
  quality?: number;
  className?: string;
  darkBg?: boolean;
  hideDownload?: boolean;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  label = 'Picture / Image',
  description = 'Upload an image file directly from your device or paste a web URL.',
  placeholder = 'https://example.com/image.jpg or select a file below',
  aspectRatio = 'auto',
  maxDimension = 1000,
  quality = 0.85,
  className = '',
  darkBg = false,
  hideDownload = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInputValue, setUrlInputValue] = useState(value && !value.startsWith('data:') ? value : '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize uploaded image to Data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Standard webp or jpeg
          const dataUrl = canvas.toDataURL('image/webp', quality);
          onChange(dataUrl);
        } else {
          onChange(event.target?.result as string);
        }
        setIsCompressing(false);
      };

      img.onerror = () => {
        // Fallback to original data URL if image rendering fails
        onChange(event.target?.result as string);
        setIsCompressing(false);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInputValue.trim()) {
      onChange(urlInputValue.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInputValue('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!value) return;
    downloadImage(value);
  };

  const isDataUrl = value?.startsWith('data:');

  const aspectClasses = {
    square: 'aspect-square max-w-[200px]',
    wide: 'aspect-video max-w-md',
    banner: 'aspect-[3/1] max-w-lg',
    auto: 'max-h-48 max-w-md',
  }[aspectRatio];

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className={`block text-xs font-bold uppercase tracking-wider ${darkBg ? 'text-slate-300' : 'text-slate-700'}`}>
            {label}
          </label>
          {value && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
              <CheckCircle className="w-3 h-3" />
              <span>Picture Ready</span>
            </span>
          )}
        </div>
      )}

      {/* Preview Box if image exists */}
      {value ? (
        <div className={`p-4 rounded-2xl border ${darkBg ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'} space-y-3`}>
          <div className="relative group overflow-hidden rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
            <img
              src={value}
              alt="Selected Preview"
              className={`object-contain ${aspectClasses}`}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
              {!hideDownload && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download this image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Source: {isDataUrl ? 'Uploaded from device' : 'Web URL link'}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-500 hover:underline font-bold"
            >
              Clear Image
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-2xl border ${darkBg ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
          {/* Sub-tab selection */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${darkBg ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkBg ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkBg ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Web URL</span>
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : darkBg
                  ? 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
                  : 'border-slate-300 hover:border-blue-400 bg-white'
              }`}
            >
              {isCompressing ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-blue-500">Processing picture...</span>
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-full ${darkBg ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${darkBg ? 'text-white' : 'text-slate-800'}`}>
                      Click to choose image file from device
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">or drag and drop your photo here (PNG, JPG, WebP, SVG)</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder={placeholder}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    darkBg
                      ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {description && (
        <p className={`text-[11px] ${darkBg ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      )}
    </div>
  );
};
