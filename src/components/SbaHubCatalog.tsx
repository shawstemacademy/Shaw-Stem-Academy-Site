import React, { useState } from 'react';
import { SbaHubOption, FormTheme } from '../types';
import { BookOpen, CheckSquare, Search, Info, Plus, Edit3, Trash2 } from 'lucide-react';

interface SbaHubCatalogProps {
  sbaHubOptions: SbaHubOption[];
  selectedSbaHubIds: string[];
  onToggleSbaHubOption: (optionId: string) => void;
  theme: FormTheme;
  canEditList?: boolean;
  onOpenManageOptions?: () => void;
}

export const SbaHubCatalog: React.FC<SbaHubCatalogProps> = ({
  sbaHubOptions,
  selectedSbaHubIds,
  onToggleSbaHubOption,
  theme,
  canEditList = false,
  onOpenManageOptions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const safeSbaHubOptions = sbaHubOptions || [];
  const offeredOptions = safeSbaHubOptions.filter((opt) => opt && opt.isOffered !== false);

  const filteredOptions = offeredOptions.filter((opt) => {
    return (
      (opt.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.discountType || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6 transition-all">
      {/* Top Banner Header */}
      <div className="px-6 py-4 bg-purple-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-purple-300 flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold">SBA Hub</h2>
            <span className="text-xs text-purple-200">S.H.A.W STEM Academy SBA Support Program</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEditList && onOpenManageOptions && (
            <button
              onClick={onOpenManageOptions}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit List Values</span>
            </button>
          )}
          <span className="text-xs font-bold px-3 py-1 bg-purple-800 text-purple-100 rounded-full border border-purple-700">
            {selectedSbaHubIds.length} SBA Aid {selectedSbaHubIds.length === 1 ? 'Selected' : 'Selected'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center justify-between">
            <span>44. Available SBA Hub aid <span className="text-red-500">*</span></span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Tick all that apply.</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search SBA aid subjects or discount types..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* SBA Hub Options Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50/50">
          {filteredOptions.length === 0 ? (
            <div className="col-span-full p-6 text-center text-xs text-gray-500">
              No SBA Hub options found.
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedSbaHubIds.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => onToggleSbaHubOption(opt.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50 border-purple-400 ring-1 ring-purple-500 text-purple-900 shadow-2xs font-semibold'
                      : 'bg-white border-gray-200 hover:border-purple-300 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded bg-purple-700 text-white flex items-center justify-center">
                          <CheckSquare className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-gray-300 bg-white" />
                      )}
                    </div>
                    <span className="text-xs truncate">{opt.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      ${opt.yearlyPrice}/{opt.pricePeriod || 'yr'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                      {opt.classType || opt.discountType || opt.level || 'CSEC'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
