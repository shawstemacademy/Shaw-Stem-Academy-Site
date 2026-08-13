import React, { useState } from 'react';
import { SbaHubOption, FormTheme, Department, ClassType, isDepartmentVisibleToStudents } from '../types';
import { formatUSD } from '../lib/formatCurrency';
import {
  BookOpen,
  CheckSquare,
  Search,
  Filter,
  Building2,
  Clock,
  User,
  MapPin,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react';

interface SbaHubCatalogProps {
  sbaHubOptions: SbaHubOption[];
  selectedSbaHubIds: string[];
  enrolledSbaHubIds?: string[];
  onToggleSbaHubOption: (optionId: string) => void;
  theme: FormTheme;
  canEditList?: boolean;
  onOpenManageOptions?: () => void;
  departments?: Department[];
  classTypes?: ClassType[];
}

export const SbaHubCatalog: React.FC<SbaHubCatalogProps> = ({
  sbaHubOptions,
  selectedSbaHubIds,
  enrolledSbaHubIds = [],
  onToggleSbaHubOption,
  theme,
  canEditList = false,
  onOpenManageOptions,
  departments = [],
  classTypes = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClassType, setSelectedClassType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc'>('alpha-asc');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const safeSbaHubOptions = sbaHubOptions || [];
  const safeEnrolledSbaHubIds = enrolledSbaHubIds || [];
  const offeredOptions = safeSbaHubOptions.filter(
    (opt) => opt && opt.isOffered !== false && (!safeEnrolledSbaHubIds.includes(opt.id) || selectedSbaHubIds.includes(opt.id))
  );

  // Helper to categorize SBA Hub options based on department keywords
  const getSbaCategory = (opt: SbaHubOption) => {
    const nameLower = (opt.name || '').toLowerCase();
    
    if (
      nameLower.includes('physic') ||
      nameLower.includes('chemistr') ||
      nameLower.includes('biolog') ||
      nameLower.includes('science') ||
      nameLower.includes('human') ||
      nameLower.includes('sba hub') && (nameLower.includes('phys') || nameLower.includes('chem') || nameLower.includes('bio'))
    ) {
      const found = departments.find(d => d.name.toLowerCase().includes('science'));
      if (found) return found.name;
      return 'Sciences';
    }

    if (
      nameLower.includes('math') ||
      nameLower.includes('algebra') ||
      nameLower.includes('geometry') ||
      nameLower.includes('add')
    ) {
      const found = departments.find(d => d.name.toLowerCase().includes('math'));
      if (found) return found.name;
      return 'Mathematics';
    }

    if (
      nameLower.includes('it') ||
      nameLower.includes('information') ||
      nameLower.includes('computer') ||
      nameLower.includes('program')
    ) {
      const found = departments.find(d => 
        d.name.toLowerCase().includes('it') || 
        d.name.toLowerCase().includes('computer') ||
        d.name.toLowerCase().includes('tech')
      );
      if (found) return found.name;
      return 'Information Technology';
    }

    // Standard word matching against student-visible departments
    for (const dept of departments) {
      if (isDepartmentVisibleToStudents(dept) && nameLower.includes(dept.name.toLowerCase())) {
        return dept.name;
      }
    }

    return 'STEM Support';
  };

  // Dynamically compute category options strictly from student-visible departments
  const activeDeptNames = (departments || [])
    .filter((d) => isDepartmentVisibleToStudents(d))
    .map((d) => d?.name)
    .filter(Boolean);
  const categories = ['All', ...activeDeptNames];

  // Filtering Logic
  const filteredOptions = offeredOptions.filter((opt) => {
    const sbaCategory = getSbaCategory(opt);
    if (!isDepartmentVisibleToStudents(sbaCategory)) {
      return false;
    }

    const matchesSearch =
      (opt.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.discountType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.instructor || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      sbaCategory === selectedCategory ||
      sbaCategory.toLowerCase() === selectedCategory.toLowerCase();

    const matchesClassType =
      selectedClassType === 'All' ||
      opt.classType === selectedClassType ||
      (() => {
        const found = classTypes?.find(
          (ct) => ct.id === selectedClassType || ct.code === selectedClassType
        );
        if (!found) return false;
        return (
          opt.classType === found.id ||
          opt.classType === found.code ||
          opt.classType?.toLowerCase() === found.name?.toLowerCase()
        );
      })();

    return matchesSearch && matchesCategory && matchesClassType;
  });

  // Sorting Logic
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (sortOrder === 'alpha-asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortOrder === 'alpha-desc') {
      return (b.name || '').localeCompare(a.name || '');
    } else if (sortOrder === 'price-asc') {
      return (a.yearlyPrice || 0) - (b.yearlyPrice || 0);
    } else if (sortOrder === 'price-desc') {
      return (b.yearlyPrice || 0) - (a.yearlyPrice || 0);
    }
    return 0;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6 transition-all">
      {/* Top Banner Header */}
      <div 
        className="px-6 py-4 bg-purple-900 text-white flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
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
              onClick={(e) => {
                e.stopPropagation();
                onOpenManageOptions();
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit List Values</span>
            </button>
          )}
          <span className="text-xs font-bold px-3 py-1 bg-purple-800 text-purple-100 rounded-full border border-purple-700">
            {selectedSbaHubIds.length} SBA Aid Selected
          </span>
          <div className="ml-2 text-purple-300 hover:text-purple-100 transition-colors">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          {/* Search, Department, Class Type & Sort Filters Bar */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SBA aid subjects..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Department Dropdown */}
            <div className="relative w-full">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer font-semibold"
              >
                <option value="All">All Departments</option>
                {categories.filter(c => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* Class Type Dropdown */}
            {classTypes && classTypes.length > 0 ? (
              <div className="relative w-full">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <select
                  value={selectedClassType}
                  onChange={(e) => setSelectedClassType(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer font-semibold"
                >
                  <option value="All">All Class Types</option>
                  {classTypes.map((ct) => (
                    <option key={ct.id} value={ct.id || ct.code}>
                      {ct.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            ) : null}

            {/* Sort Dropdown */}
            <div className="relative w-full">
              <select
                value={sortOrder}
                aria-label="Sort SBA Hub options"
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 appearance-none cursor-pointer font-semibold"
              >
                <option value="alpha-asc">Sort: A to Z</option>
                <option value="alpha-desc">Sort: Z to A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Full-Width Department Category Chips Row */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 px-1">
              <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Department:</span>
            </div>

            <div className="relative flex items-center min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sba-category-scroll-container');
                  if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full shadow-2xs text-gray-600 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-700 shrink-0 z-10 mr-1 transition-all"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                id="sba-category-scroll-container"
                className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 scroll-smooth max-w-full"
                style={{ scrollbarWidth: 'thin' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-700 text-white shadow-2xs ring-2 ring-purple-400/30'
                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('sba-category-scroll-container');
                  if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full shadow-2xs text-gray-600 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-700 shrink-0 z-10 ml-1 transition-all"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* SBA Hub Options List */}
        <div className="space-y-4">
          {sortedOptions.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No SBA Hub options found matching your criteria.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedClassType('All');
                  setSortOrder('alpha-asc');
                }}
                className="mt-2 text-xs font-semibold text-purple-600 hover:underline"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            sortedOptions.map((opt) => {
              const isSelected = selectedSbaHubIds.includes(opt.id);
              const sbaCategory = getSbaCategory(opt);
              const scheduleText = opt.days && opt.days.length > 0
                ? `${opt.days.join(' & ')} ${opt.startTime || ''} - ${opt.endTime || ''}`
                : 'Flexible Schedule / Academic Help';

              return (
                <div
                  key={opt.id}
                  onClick={() => onToggleSbaHubOption(opt.id)}
                  className={`group relative p-4 sm:p-5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded bg-purple-700 text-white flex items-center justify-center shadow-2xs">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-300 group-hover:border-purple-500 bg-white" />
                      )}
                    </div>

                    {/* Class Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-900">
                            {opt.name}
                          </h3>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {sbaCategory}
                          </span>
                        </div>

                        {/* Price Badge */}
                        <div className="text-right">
                          <span className="text-lg font-black text-purple-900">{formatUSD(opt.yearlyPrice)}</span>
                          <span className="text-[11px] text-gray-500 font-normal">
                            /{opt.pricePeriod || 'yr'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Complete support and professional feedback for completing SBA lab and theory components under specialized guidance. Includes layout analysis, draft grading, and syllabus alignment.
                      </p>

                      {/* Class Metadata Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1 text-gray-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>{scheduleText}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Instructor: {opt.instructor || 'STEM Specialist'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{opt.location || 'STEM Lab / Online'}</span>
                        </div>
                        {opt.capacity && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>Capacity: {opt.capacity} students</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200">
                            {opt.classType || opt.level || 'CSEC'} Level
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}
    </div>
  );
};
