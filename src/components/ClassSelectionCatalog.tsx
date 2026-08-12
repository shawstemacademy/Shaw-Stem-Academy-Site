import React, { useState } from 'react';
import { ClassItem, FormTheme, ScheduleClash, Department, ClassType, isDepartmentVisibleToStudents } from '../types';
import { checkStudentSelectedClashes } from '../lib/scheduleClashUtils';
import {
  CheckSquare,
  Square,
  Search,
  Filter,
  Building2,
  Clock,
  User,
  MapPin,
  Sparkles,
  Users,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ClassSelectionCatalogProps {
  classList: ClassItem[];
  selectedClassIds: string[];
  enrolledClassIds?: string[];
  onToggleClass: (classId: string) => void;
  theme: FormTheme;
  canEditList?: boolean;
  onOpenManageOptions?: () => void;
  clashes?: ScheduleClash[];
  departments?: Department[];
  classTypes?: ClassType[];
}

export const ClassSelectionCatalog: React.FC<ClassSelectionCatalogProps> = ({
  classList,
  selectedClassIds,
  enrolledClassIds = [],
  onToggleClass,
  theme,
  canEditList = false,
  onOpenManageOptions,
  clashes = [],
  departments = [],
  classTypes = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClassType, setSelectedClassType] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc'>('alpha-asc');
  const [isCollapsed, setIsCollapsed] = useState(true);

  // ONLY show courses where isOffered !== false and student is NOT currently registered for
  const safeClassList = classList || [];
  const safeEnrolledIds = enrolledClassIds || [];
  const offeredClasses = safeClassList.filter((cls) => cls && cls.isOffered !== false);
  const unregisteredOfferedClasses = offeredClasses.filter(
    (cls) => !safeEnrolledIds.includes(cls.id) || selectedClassIds.includes(cls.id)
  );

  // Dynamically compute category options strictly from departments visible to students
  const activeDeptNames = (departments || [])
    .filter((d) => isDepartmentVisibleToStudents(d))
    .map((d) => d?.name)
    .filter(Boolean);
  const categories = ['All', ...activeDeptNames];

  const selectedDeptObj = departments.find((d) => d.name === selectedCategory);

  const filteredClasses = unregisteredOfferedClasses.filter((cls) => {
    // Exclude classes belonging to hidden or administration/registrar departments
    const deptObj = departments.find((d) => d.name === cls.category || d.id === cls.category || d.code === cls.category);
    if (deptObj && !isDepartmentVisibleToStudents(deptObj)) {
      return false;
    }
    if (!deptObj && cls.category && !isDepartmentVisibleToStudents(cls.category)) {
      return false;
    }

    const matchesSearch =
      (cls?.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (cls?.instructor || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (cls?.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      cls?.category === selectedCategory ||
      cls?.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedDeptObj && (
        cls?.category?.toLowerCase() === selectedDeptObj.code?.toLowerCase() ||
        cls?.category === selectedDeptObj.id
      ));

    const matchesClassType =
      selectedClassType === 'All' ||
      cls?.classType === selectedClassType ||
      (() => {
        const found = classTypes?.find(
          (ct) => ct.id === selectedClassType || ct.code === selectedClassType
        );
        if (!found) return false;
        return (
          cls?.classType === found.id ||
          cls?.classType === found.code ||
          cls?.classType?.toLowerCase() === found.name?.toLowerCase()
        );
      })();

    return matchesSearch && matchesCategory && matchesClassType;
  });

  // Sort classes
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    if (sortOrder === 'alpha-asc') {
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortOrder === 'alpha-desc') {
      return (b.title || '').localeCompare(a.title || '');
    } else if (sortOrder === 'price-asc') {
      return (a.price || 0) - (b.price || 0);
    } else if (sortOrder === 'price-desc') {
      return (b.price || 0) - (a.price || 0);
    }
    return 0;
  });

  // Check selected classes for schedule clashes
  const clashCheck = checkStudentSelectedClashes(selectedClassIds || [], safeClassList, clashes || []);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-6 transition-all">
      {/* Top Header */}
      <div 
        className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-600" />
            Class Selection & Schedule
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select one or more classes to enroll. Tuition is added immediately to your running total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEditList && onOpenManageOptions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenManageOptions();
              }}
              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 flex items-center gap-1.5 transition-colors"
            >
              <span>Course Bank & Settings</span>
            </button>
          )}
          <div className="text-xs font-semibold px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
            {selectedClassIds.length} {selectedClassIds.length === 1 ? 'Class' : 'Classes'} Selected
          </div>
          <div className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Already Enrolled Filtering Notification */}
      {safeEnrolledIds.length > 0 && (
        <div className="px-6 pt-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Registration Filtering Active:</strong> Only showing classes you are <em>not</em> currently registered for ({safeEnrolledIds.length} already enrolled course{safeEnrolledIds.length > 1 ? 's' : ''} hidden).
              </span>
            </div>
            <span className="font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300 shrink-0">
              {unregisteredOfferedClasses.length} Available
            </span>
          </div>
        </div>
      )}

      {/* Real-time Schedule Clash Warning Banner */}
      {clashCheck.hasClash && (
        <div className="px-6 pt-4">
          {clashCheck.hasInadmissibleClash ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>⚠️ Schedule Clash Detected</span>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                The classes you selected have an overlapping time schedule. Please resolve the conflict by selecting non-overlapping courses or contact the academic office.
              </p>
              <ul className="list-disc pl-5 text-xs font-medium text-red-800 space-y-1">
                {clashCheck.clashes.map((c, idx) => (
                  <li key={idx}>
                    <strong>{c.classA.title}</strong> overlaps with <strong>{c.classB.title}</strong> ({c.detail})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>ℹ️ Admissible Schedule Overlap</span>
              </div>
              <p className="text-xs text-amber-800">
                The selected courses have an approved schedule overlap exception granted by staff. You may proceed with registration.
              </p>
            </div>
          )}
        </div>
      )}

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
                placeholder="Search classes or instructors..."
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
                aria-label="Sort classes"
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
                  const el = document.getElementById('category-scroll-container');
                  if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                }}
                className="flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full shadow-2xs text-gray-600 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-700 shrink-0 z-10 mr-1 transition-all"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                id="category-scroll-container"
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
                  const el = document.getElementById('category-scroll-container');
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

        {/* Classes List (Checkbox Style) */}
        <div className="space-y-4">
          {sortedClasses.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No classes found matching your criteria.</p>
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
            sortedClasses.map((cls) => {
              const isSelected = selectedClassIds.includes(cls.id);
              const availableSeats = cls.capacity - cls.enrolled;

              return (
                <div
                  key={cls.id}
                  onClick={() => onToggleClass(cls.id)}
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
                            {cls.title}
                          </h3>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {cls.category}
                          </span>
                        </div>

                        {/* Price Badge */}
                        <div className="text-right">
                          <span className="text-lg font-black text-purple-900">${cls.price}</span>
                          <span className="text-[11px] text-gray-500 font-normal">
                            {cls.pricePeriod ? ` / ${cls.pricePeriod}` : ' / semester'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{cls.description}</p>

                      {/* Class Metadata Badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1 text-gray-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-purple-600" />
                          <span>{cls.schedule}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Instructor: {cls.instructor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{cls.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>{cls.ageGroup}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              availableSeats <= 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {availableSeats} seats left
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
        </>
      )}
    </div>
  );
};
