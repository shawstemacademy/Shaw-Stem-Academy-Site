import React from 'react';
import { Video, FileSpreadsheet, FileText, Archive, Download } from 'lucide-react';
import { downloadImage } from '../../lib/downloadHelper';

interface MediaAttachmentViewerProps {
  url?: string;
  title: string;
  logoUrl?: string;
  type?: 'announcement' | 'resource';
}

export const MediaAttachmentViewer: React.FC<MediaAttachmentViewerProps> = ({
  url,
  title,
  logoUrl = '/logo.png',
  type = 'resource',
}) => {
  // 1. FALLBACK: If no picture or file was uploaded, render the Shaw STEM Academy logo badge
  if (!url || url.trim() === '') {
    return (
      <div className="pt-2 flex items-center gap-3">
        <div className="h-20 w-36 bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
          <img
            src={logoUrl}
            alt="Shaw STEM Academy Logo"
            className="h-10 w-auto object-contain mb-1"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight line-clamp-1">
            Shaw STEM Academy
          </span>
        </div>
      </div>
    );
  }

  // Detect specific file format
  const isVideo = url.startsWith('data:video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
  const isPdf = url.startsWith('data:application/pdf') || /\.pdf$/i.test(url);
  const isPpt = url.includes('presentation') || /\.(ppt|pptx)$/i.test(url);
  const isDoc = url.includes('word') || /\.(doc|docx)$/i.test(url);
  const isZip = url.includes('zip') || /\.(zip|rar|7z|tar|gz)$/i.test(url);

  // 2. Video Player
  if (isVideo) {
    return (
      <div className="pt-2 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Video className="w-4 h-4 text-purple-600" />
          <span>Class Video Recording</span>
        </div>
        <video
          src={url}
          controls
          className="h-44 w-full max-w-md rounded-xl border border-slate-200 bg-black object-contain shadow-xs"
        />
      </div>
    );
  }

  // 3. Documents / PowerPoint / PDF / Archives
  if (isPpt || isDoc || isPdf || isZip) {
    const badgeStyle = isPpt
      ? 'bg-amber-50 text-amber-900 border-amber-200'
      : isPdf
      ? 'bg-rose-50 text-rose-900 border-rose-200'
      : isDoc
      ? 'bg-blue-50 text-blue-900 border-blue-200'
      : 'bg-purple-50 text-purple-900 border-purple-200';

    const IconComponent = isPpt ? FileSpreadsheet : isPdf ? FileText : isDoc ? FileText : Archive;
    const typeLabel = isPpt
      ? 'PowerPoint Presentation'
      : isPdf
      ? 'PDF Document'
      : isDoc
      ? 'Word Document'
      : 'Archive File Package';

    return (
      <div className="pt-2 flex items-center gap-3">
        <div className={`p-3 rounded-xl border ${badgeStyle} flex items-center gap-3 max-w-md w-full shadow-2xs`}>
          <IconComponent className="w-6 h-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{title}</div>
            <div className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
              {typeLabel}
            </div>
          </div>
          <a
            href={url}
            download={`${title.replace(/[^a-zA-Z0-9]/g, '_')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download</span>
          </a>
        </div>
      </div>
    );
  }

  // 4. Default Image File
  return (
    <div className="pt-2 flex items-center gap-3 flex-wrap">
      <img
        src={url}
        alt={title}
        className="h-24 w-36 object-cover rounded-xl border border-slate-200 shadow-2xs"
        onError={(e) => {
          (e.target as HTMLImageElement).src = logoUrl || '/logo.png';
        }}
      />
      <button
        type="button"
        onClick={() => downloadImage(url, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`)}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-blue-600" />
        <span>Download Attachment</span>
      </button>
    </div>
  );
};
