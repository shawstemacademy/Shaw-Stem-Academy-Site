import React from 'react';
import { FormTheme } from '../types';
import { Sparkles } from 'lucide-react';

interface FormHeaderProps {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  theme: FormTheme;
  setTheme: (t: FormTheme) => void;
  themes: FormTheme[];
  onOpenDiscountConfig: () => void;
  isEditing: boolean;
  setIsEditing: (e: boolean) => void;
  canEditHeader?: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  theme,
  setTheme,
  themes,
  onOpenDiscountConfig,
  isEditing,
  setIsEditing,
  canEditHeader = true,
}) => {
  return (
    <div className="relative bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden transition-all duration-300 mb-6">
      {/* Top Accent Strip */}
      <div className={`h-3.5 w-full ${theme.headerBg}`} />

      <div className="p-6 sm:p-8">
        {/* Actions bar inside header card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              STEM Class Registration
            </span>
          </div>

          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* Form Title & Description */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Form Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-bold text-gray-900 border-b-2 border-purple-500 focus:outline-hidden py-1"
                placeholder="Class Registration Form Title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Form Description / Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                placeholder="Enter instructions for student registration and payment..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 bg-purple-700 text-white text-xs font-semibold rounded-md hover:bg-purple-800"
              >
                Save Header
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4 group">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                {title}
              </h1>
              {canEditHeader && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-400 hover:text-purple-600 underline opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  Edit Title
                </button>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}


      </div>
    </div>
  );
};
