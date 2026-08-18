import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  FileText,
  Building2,
  Printer,
  ChevronRight,
  GraduationCap,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  Grid,
  List,
  Edit3,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2
} from 'lucide-react';
import { ClassItem, SbaHubOption, ClassType, SchoolUser, TeacherProfile, PortalTab } from '../../types';
import { extractDaysAndTimes, minutesToFormattedTime } from '../../lib/scheduleClashUtils';
import { formatUSD } from '../../lib/formatCurrency';

interface LocationOption {
  id?: string;
  name: string;
  roomNumber?: string;
  capacity?: number;
}

interface UnifiedScheduleItem {
  id: string;
  title: string;
  isSbaHub: boolean;
  classType: string; // e.g. 'CSEC', 'CAPE', 'Primary'
  schedule: string;
  days: string[];
  startMins: number;
  endMins: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  instructor: string;
  location: string;
  price: number;
  pricePeriod: string;
  category: string;
  description?: string;
  rawClassItem?: ClassItem;
  rawSbaOption?: SbaHubOption;
}

interface TimetablePageProps {
  classes: ClassItem[];
  sbaHubOptions: SbaHubOption[];
  classTypes?: ClassType[];
  schoolUsers?: SchoolUser[];
  teachers?: TeacherProfile[];
  locations?: LocationOption[];
  onNavigateTab: (tab: PortalTab) => void;
  onToggleClass?: (classId: string) => void;
  selectedClassIds?: string[];
  loggedInUser?: SchoolUser | null;
  logoUrl?: string;
  onUpdateClassList?: (updatedClasses: ClassItem[]) => void;
  onUpdateSbaHubOptions?: (updatedOptions: SbaHubOption[]) => void;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Non-flickering Instructor Avatar Component
const InstructorAvatar: React.FC<{
  instructor: string;
  avatarUrl: string;
  logoUrl: string;
  className: string;
}> = ({ instructor, avatarUrl, logoUrl, className }) => {
  const [hasError, setHasError] = useState(false);

  const isVacant =
    !instructor ||
    instructor.trim() === '' ||
    instructor.toLowerCase().includes('vacant') ||
    instructor.toLowerCase().includes('tbd') ||
    instructor.toLowerCase().includes('staff');

  const finalSrc = isVacant || hasError || !avatarUrl ? logoUrl || '/logo.png' : avatarUrl;

  return (
    <img
      src={finalSrc}
      alt={instructor || 'Instructor'}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
    />
  );
};

export const TimetablePage: React.FC<TimetablePageProps> = ({
  classes,
  sbaHubOptions,
  classTypes = [],
  schoolUsers = [],
  teachers = [],
  locations = [],
  onNavigateTab,
  onToggleClass,
  selectedClassIds = [],
  loggedInUser,
  logoUrl = '/logo.png',
  onUpdateClassList,
  onUpdateSbaHubOptions,
}) => {
  const [selectedClassTypeTab, setSelectedClassTypeTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItemDetail, setSelectedItemDetail] = useState<UnifiedScheduleItem | null>(null);

  // Admin Editing State
  const [editingItem, setEditingItem] = useState<UnifiedScheduleItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editClassType, setEditClassType] = useState('CSEC');
  const [editInstructor, setEditInstructor] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDays, setEditDays] = useState<string[]>([]);
  const [editStartTime, setEditStartTime] = useState('16:00');
  const [editEndTime, setEditEndTime] = useState('17:30');
  const [editPrice, setEditPrice] = useState<number | string>(150);
  const [editPricePeriod, setEditPricePeriod] = useState('yr');
  const [editCapacity, setEditCapacity] = useState<number | string>(15);
  const [editIsOffered, setEditIsOffered] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Helper to resolve teacher avatar picture
  const getTeacherAvatar = (instructorName: string): string => {
    if (
      !instructorName ||
      instructorName.trim() === '' ||
      instructorName.toLowerCase().includes('vacant') ||
      instructorName.toLowerCase().includes('tbd') ||
      instructorName.toLowerCase().includes('staff')
    ) {
      return logoUrl || '/logo.png';
    }
    const nameLower = instructorName.trim().toLowerCase();
    if (teachers && teachers.length > 0) {
      const matchTeacher = teachers.find((t) => t.name && t.name.trim().toLowerCase() === nameLower);
      if (matchTeacher && matchTeacher.avatar) {
        return matchTeacher.avatar;
      }
    }
    if (schoolUsers && schoolUsers.length > 0) {
      const matchUser = schoolUsers.find((u) => u.name && u.name.trim().toLowerCase() === nameLower);
      if (matchUser && (matchUser.avatar || (matchUser as any).picture || (matchUser as any).photoUrl)) {
        return matchUser.avatar || (matchUser as any).picture || (matchUser as any).photoUrl;
      }
    }
    return logoUrl || '/logo.png';
  };

  // 1. Build dynamic list of Class Types (Clean single SBA Hub Timetable tab)
  const availableClassTypes = useMemo(() => {
    const list: { code: string; name: string }[] = [];
    const seen = new Set<string>();

    // Standard defaults including SBA Hub
    const defaults = [
      { code: 'CSEC', name: 'CSEC (Caribbean Secondary Education Certificate)' },
      { code: 'CAPE', name: 'CAPE (Caribbean Advanced Proficiency Examination)' },
      { code: 'SBA_HUB', name: 'SBA Hub Timetable' },
    ];

    defaults.forEach((d) => {
      seen.add(d.code.toUpperCase());
      list.push(d);
    });

    // Custom class types from system configuration
    (classTypes || []).forEach((ct) => {
      const codeUpper = (ct.code || ct.name || '').toUpperCase();
      const isSbaType =
        ct.isSbaHub ||
        codeUpper.includes('SBA') ||
        codeUpper.includes('HUB') ||
        codeUpper === 'SBAH' ||
        codeUpper === 'SBA_HUB';

      if (codeUpper && !seen.has(codeUpper) && !isSbaType) {
        seen.add(codeUpper);
        list.push({
          code: ct.code || ct.name,
          name: ct.name || ct.code,
        });
      }
    });

    // Extract any extra classType codes from classes
    classes.forEach((c) => {
      if (c.classType) {
        const u = c.classType.toUpperCase();
        const isSbaType = u.includes('SBA') || u.includes('HUB') || u === 'SBAH' || u === 'SBA_HUB';
        if (!seen.has(u) && !isSbaType) {
          seen.add(u);
          list.push({ code: c.classType, name: c.classType });
        }
      }
    });

    return list;
  }, [classTypes, classes]);

  // Helper to normalize class type for matching
  const matchClassType = (itemType: string, targetType: string): boolean => {
    if (!itemType || !targetType) return false;
    const it = itemType.trim().toUpperCase();
    const tt = targetType.trim().toUpperCase();

    if (it === tt) return true;
    if (tt === 'CSEC' && (it.includes('CSEC') || it.includes('CXC') || it.includes('SEC'))) return true;
    if (tt === 'CAPE' && (it.includes('CAPE') || it.includes('ADVANCED'))) return true;
    return false;
  };

  // Helper to deduce class type if not explicitly set on item
  const inferClassType = (title: string, category?: string, explicitType?: string): string => {
    if (explicitType) {
      const u = explicitType.toUpperCase();
      if (u.includes('CSEC')) return 'CSEC';
      if (u.includes('CAPE')) return 'CAPE';
      return explicitType;
    }
    const combined = `${title} ${category || ''}`.toUpperCase();
    if (combined.includes('CAPE')) return 'CAPE';
    if (combined.includes('CSEC')) return 'CSEC';
    return 'CSEC'; // default fallback
  };

  // 2. Build unified list of scheduled classes & SBA Hub options (excluding archived/bank items)
  const unifiedScheduleItems = useMemo<UnifiedScheduleItem[]>(() => {
    const items: UnifiedScheduleItem[] = [];

    // Process Regular Classes (only active/offered & not archived)
    classes
      .filter((c) => c && c.isOffered !== false && !(c as any).isArchived)
      .forEach((c) => {
        const extracted = extractDaysAndTimes(c);
        const inferredType = inferClassType(c.title, c.category, c.classType);

        items.push({
          id: c.id,
          title: c.title,
          isSbaHub: false,
          classType: inferredType,
          schedule: c.schedule || 'Schedule TBD',
          days: extracted.days.length > 0 ? extracted.days : ['Monday', 'Wednesday'],
          startMins: extracted.startMins || 16 * 60,
          endMins: extracted.endMins || 17 * 60 + 30,
          startTimeFormatted: minutesToFormattedTime(extracted.startMins || 16 * 60),
          endTimeFormatted: minutesToFormattedTime(extracted.endMins || 17 * 60 + 30),
          instructor: c.instructor || 'Vacant / TBD',
          location: c.location || 'Shaw STEM Academy Lab',
          price: c.price,
          pricePeriod: c.pricePeriod || 'yr',
          category: c.category || 'STEM Course',
          description: c.description,
          rawClassItem: c,
        });
      });

    // Process SBA Hub Classes (only active/offered & not archived)
    sbaHubOptions
      .filter((s) => s && s.isOffered !== false && !(s as any).isArchived)
      .forEach((s) => {
        const extracted = extractDaysAndTimes(s);
        const inferredType = inferClassType(s.name, undefined, s.classType || s.discountType || s.level);

        items.push({
          id: s.id,
          title: s.name.toLowerCase().includes('sba') ? s.name : `${s.name} (SBA Hub)`,
          isSbaHub: true,
          classType: inferredType,
          schedule: `SBA Hub: ${(extracted.days || []).join(', ') || 'Weekly'} ${minutesToFormattedTime(extracted.startMins)} - ${minutesToFormattedTime(extracted.endMins)}`,
          days: extracted.days.length > 0 ? extracted.days : ['Tuesday', 'Thursday'],
          startMins: extracted.startMins || 16 * 60,
          endMins: extracted.endMins || 18 * 60,
          startTimeFormatted: minutesToFormattedTime(extracted.startMins || 16 * 60),
          endTimeFormatted: minutesToFormattedTime(extracted.endMins || 18 * 60),
          instructor: s.instructor || 'SBA Hub Director',
          location: s.location || 'Online SBA Hub Studio',
          price: s.yearlyPrice,
          pricePeriod: s.pricePeriod || 'yr',
          category: 'SBA Hub',
          description: `Dedicated SBA moderation, lab practical guidance, and school-based assessment project support.`,
          rawSbaOption: s,
        });
      });

    // Sort by start time ascending
    return items.sort((a, b) => a.startMins - b.startMins);
  }, [classes, sbaHubOptions]);

  // Filter items based on active class type tab, search query, and day
  const filteredItems = useMemo(() => {
    return unifiedScheduleItems.filter((item) => {
      // 1. Filter by Class Type / Timetable Tab
      if (selectedClassTypeTab === 'SBA_HUB') {
        if (!item.isSbaHub) return false;
      } else if (selectedClassTypeTab !== 'ALL') {
        if (item.isSbaHub) return false;
        const matchesType = matchClassType(item.classType, selectedClassTypeTab);
        if (!matchesType) return false;
      }

      // 2. Filter by Day
      if (selectedDay !== 'ALL') {
        if (!item.days.includes(selectedDay)) return false;
      }

      // 3. Filter by Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inInstructor = item.instructor.toLowerCase().includes(q);
        const inLocation = item.location.toLowerCase().includes(q);
        const inCategory = item.category.toLowerCase().includes(q);
        const inType = item.classType.toLowerCase().includes(q);
        if (!inTitle && !inInstructor && !inLocation && !inCategory && !inType) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedScheduleItems, selectedClassTypeTab, selectedDay, searchQuery]);

  // Group items by day for the Weekly Grid
  const itemsByDay = useMemo(() => {
    const map: Record<string, UnifiedScheduleItem[]> = {};
    ALL_DAYS.forEach((d) => {
      map[d] = [];
    });

    filteredItems.forEach((item) => {
      item.days.forEach((day) => {
        if (map[day]) {
          map[day].push(item);
        }
      });
    });

    // Sort items within each day by startMins
    ALL_DAYS.forEach((d) => {
      map[d].sort((a, b) => a.startMins - b.startMins);
    });

    return map;
  }, [filteredItems]);

  // Count helper per class type
  const getTypeCount = (typeCode: string) => {
    if (typeCode === 'ALL') return unifiedScheduleItems.length;
    if (typeCode === 'SBA_HUB') return unifiedScheduleItems.filter((item) => item.isSbaHub).length;
    return unifiedScheduleItems.filter((item) => !item.isSbaHub && matchClassType(item.classType, typeCode)).length;
  };

  const handlePrintTimetable = () => {
    window.print();
  };

  // Open Edit Class Modal for Admin
  const handleOpenEditModal = (item: UnifiedScheduleItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || 'STEM Course');
    setEditClassType(item.classType || 'CSEC');
    setEditInstructor(item.instructor || 'Vacant / TBD');
    setEditLocation(item.location || 'Shaw STEM Academy Lab');
    setEditDays(item.days && item.days.length > 0 ? item.days : ['Monday', 'Wednesday']);

    const startHH = String(Math.floor(item.startMins / 60)).padStart(2, '0');
    const startMM = String(item.startMins % 60).padStart(2, '0');
    const endHH = String(Math.floor(item.endMins / 60)).padStart(2, '0');
    const endMM = String(item.endMins % 60).padStart(2, '0');

    setEditStartTime(`${startHH}:${startMM}`);
    setEditEndTime(`${endHH}:${endMM}`);
    setEditPrice(item.price || 150);
    setEditPricePeriod(item.pricePeriod || 'yr');
    setEditCapacity(item.rawClassItem?.capacity || item.rawSbaOption?.capacity || 15);
    setEditIsOffered(item.rawClassItem?.isOffered !== false && item.rawSbaOption?.isOffered !== false);
  };

  const handleToggleDay = (day: string) => {
    if (editDays.includes(day)) {
      if (editDays.length > 1) {
        setEditDays(editDays.filter((d) => d !== day));
      }
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const daysStr = editDays.join(' & ');
    const schedText = `${daysStr} ${editStartTime} - ${editEndTime}`;

    if (editingItem.isSbaHub) {
      if (onUpdateSbaHubOptions && sbaHubOptions) {
        const updatedSba = sbaHubOptions.map((s) => {
          if (s.id === editingItem.id) {
            return {
              ...s,
              name: editTitle.trim(),
              classType: editClassType,
              yearlyPrice: Number(editPrice) || s.yearlyPrice || 150,
              pricePeriod: editPricePeriod,
              instructor: editInstructor.trim() || 'Vacant / TBD',
              location: editLocation.trim() || 'Online SBA Hub Studio',
              days: editDays,
              startTime: editStartTime,
              endTime: editEndTime,
              capacity: Number(editCapacity) || 15,
              isOffered: editIsOffered,
            };
          }
          return s;
        });
        onUpdateSbaHubOptions(updatedSba);
      }
    } else {
      if (onUpdateClassList && classes) {
        const updatedClasses = classes.map((c) => {
          if (c.id === editingItem.id) {
            return {
              ...c,
              title: editTitle.trim(),
              category: editCategory.trim() || 'STEM Course',
              classType: editClassType,
              price: Number(editPrice) || c.price || 150,
              pricePeriod: editPricePeriod,
              instructor: editInstructor.trim() || 'Vacant / TBD',
              location: editLocation.trim() || 'Shaw STEM Academy Lab',
              days: editDays,
              startTime: editStartTime,
              endTime: editEndTime,
              schedule: schedText,
              capacity: Number(editCapacity) || 15,
              isOffered: editIsOffered,
            };
          }
          return c;
        });
        onUpdateClassList(updatedClasses);
      }
    }

    setSaveSuccessMsg(`Successfully updated "${editTitle}" in database sitewide!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setEditingItem(null);
    if (selectedItemDetail?.id === editingItem.id) {
      setSelectedItemDetail(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold text-xs rounded-2xl flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>Official Class Schedules</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Class & SBA Timetable
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Explore CSEC, CAPE, and SBA Hub laboratory schedules. Filter by program type or day to plan your academic week seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrintTimetable}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print / Export Timetable</span>
            </button>
            <button
              onClick={() => onNavigateTab('login')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Register for Classes</span>
            </button>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by subject, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Weekly Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Program Timetable Selector Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Select Program Timetable</span>
          </h2>
          {loggedInUser?.role === 'admin' && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
              <Edit3 className="w-3 h-3" />
              <span>Admin Mode: Timetable Editable</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSelectedClassTypeTab('ALL')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              selectedClassTypeTab === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>All Timetables</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
              selectedClassTypeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {getTypeCount('ALL')}
            </span>
          </button>

          {availableClassTypes.map((type) => {
            const isSelected = selectedClassTypeTab === type.code;
            const count = getTypeCount(type.code);
            const displayLabel = type.code === 'SBA_HUB'
              ? 'SBA Hub Timetable'
              : `${type.code.replace(/_/g, ' ')} Timetable`;

            return (
              <button
                key={type.code}
                onClick={() => setSelectedClassTypeTab(type.code)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{displayLabel}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Filter Sub-Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Day:</span>
        </span>
        <button
          onClick={() => setSelectedDay('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedDay === 'ALL'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Days
        </button>
        {ALL_DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedDay === d
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Main Timetable Content */}
      {viewMode === 'grid' ? (
        /* WEEKLY GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {ALL_DAYS.map((day) => {
            const dayItems = itemsByDay[day] || [];
            if (selectedDay !== 'ALL' && selectedDay !== day) return null;

            return (
              <div
                key={day}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col"
              >
                {/* Day Column Header */}
                <div className="bg-slate-900 text-white px-4 py-3 font-extrabold text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
                  <span>{day}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                    {dayItems.length}
                  </span>
                </div>

                {/* Slot Cards for this Day */}
                <div className="p-3 space-y-3 grow bg-slate-50/50 dark:bg-slate-950/20">
                  {dayItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic font-medium">
                      No classes on {day}
                    </div>
                  ) : (
                    dayItems.map((item) => (
                      <div
                        key={`${item.id}-${day}`}
                        onClick={() => setSelectedItemDetail(item)}
                        className={`group p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs space-y-2.5 relative ${
                          item.isSbaHub
                            ? 'bg-purple-50/80 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 hover:border-purple-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                        }`}
                      >
                        {/* Badges & Class Type Tag */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold">
                          <span className={`px-2 py-0.5 rounded-md uppercase tracking-wide ${
                            item.isSbaHub
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-blue-600 text-white shadow-2xs'
                          }`}>
                            {item.classType}
                          </span>

                          <div className="flex items-center gap-1">
                            {item.isSbaHub && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-900 font-extrabold text-[9px] flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>SBA HUB</span>
                              </span>
                            )}

                            {/* Admin Quick Edit Pencil */}
                            {loggedInUser?.role === 'admin' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(item);
                                }}
                                className="p-1 bg-amber-500/10 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border border-amber-500/20"
                                title="Edit Class in Database"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>

                        {/* Schedule Time Pill */}
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{item.startTimeFormatted} - {item.endTimeFormatted}</span>
                        </div>

                        {/* Instructor & Location */}
                        <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <InstructorAvatar
                              instructor={item.instructor}
                              avatarUrl={getTeacherAvatar(item.instructor)}
                              logoUrl={logoUrl}
                              className="w-4 h-4 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                            <span className="truncate">{item.instructor}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>

                        {/* Footer Tuition Fee */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-400">
                            {formatUSD(item.price)}/{item.pricePeriod || 'yr'}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Details</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED LIST VIEW */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                    <th className="py-4 px-4">Program / Type</th>
                    <th className="py-4 px-4">Subject & Session</th>
                    <th className="py-4 px-4">Schedule Days & Time</th>
                    <th className="py-4 px-4">Instructor</th>
                    <th className="py-4 px-4">Room / Location</th>
                    <th className="py-4 px-4 text-right">Tuition Fee</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Class Type & SBA Badge */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                            item.isSbaHub
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'bg-blue-600 text-white shadow-2xs'
                          }`}>
                            {item.classType}
                          </span>
                          {item.isSbaHub && (
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 font-extrabold text-[9px] inline-flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>SBA HUB CLASS</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Category: {item.category}
                          </div>
                        </div>
                      </td>

                      {/* Schedule Days & Time */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{item.days.join(', ')}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.startTimeFormatted} - {item.endTimeFormatted}</span>
                          </div>
                        </div>
                      </td>

                      {/* Instructor */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-2xs">
                            <InstructorAvatar
                              instructor={item.instructor}
                              avatarUrl={getTeacherAvatar(item.instructor)}
                              logoUrl={logoUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.instructor}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="font-extrabold text-purple-700 dark:text-purple-400 text-sm">
                          {formatUSD(item.price)}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          Per {item.pricePeriod || 'yr'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {loggedInUser?.role === 'admin' && (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-amber-500/20"
                              title="Edit Class in Database"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedItemDetail.isSbaHub ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {selectedItemDetail.classType}
                  </span>
                  {selectedItemDetail.isSbaHub && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>SBA HUB COURSE</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {selectedItemDetail.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedItemDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Days & Schedule</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {selectedItemDetail.days.join(', ')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Session Hours</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {selectedItemDetail.startTimeFormatted} - {selectedItemDetail.endTimeFormatted}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Instructor</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <InstructorAvatar
                    instructor={selectedItemDetail.instructor}
                    avatarUrl={getTeacherAvatar(selectedItemDetail.instructor)}
                    logoUrl={logoUrl}
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-600"
                  />
                  <span>{selectedItemDetail.instructor}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Room / Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedItemDetail.location}
                </span>
              </div>
            </div>

            {/* Price Banner */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Tuition Rate</span>
                <span className="text-lg font-black text-purple-900 dark:text-purple-200">
                  {formatUSD(selectedItemDetail.price)} / {selectedItemDetail.pricePeriod || 'yr'}
                </span>
              </div>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium max-w-[160px] text-right">
                Eligible for multi-class bundle discounts & student portal tracking
              </span>
            </div>

            {/* Description */}
            {selectedItemDetail.description && (
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                {selectedItemDetail.description}
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              {loggedInUser?.role === 'admin' && (
                <button
                  onClick={() => handleOpenEditModal(selectedItemDetail)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Class</span>
                </button>
              )}
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedItemDetail(null);
                  if (onToggleClass && selectedItemDetail.rawClassItem) {
                    onToggleClass(selectedItemDetail.rawClassItem.id);
                  }
                  onNavigateTab('login');
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Register for Course</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EDIT CLASS MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Edit Timetable Entry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Updates will sync to the database and reflect sitewide.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Class Type */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Program / Level
                  </label>
                  <select
                    value={editClassType}
                    onChange={(e) => setEditClassType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="CSEC">CSEC</option>
                    <option value="CAPE">CAPE</option>
                    <option value="Primary">Primary</option>
                    <option value="Lower Secondary">Lower Secondary</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g. Science & Tech"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Instructor */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Assigned Instructor
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={teachers.some(t => t.name === editInstructor) ? editInstructor : ''}
                    onChange={(e) => {
                      if (e.target.value) setEditInstructor(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">Select Registered Teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} ({t.subjectSpecialty || 'Faculty'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    placeholder="Or type instructor name (or Vacant)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Room / Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={locations.some(l => l.name === editLocation) ? editLocation : ''}
                    onChange={(e) => {
                      if (e.target.value) setEditLocation(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">Select Saved Location...</option>
                    {locations.map((loc) => (
                      <option key={loc.id || loc.name} value={loc.name}>
                        {loc.name} {loc.roomNumber ? `(${loc.roomNumber})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Or type custom room/lab"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Schedule Days */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Class Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((d) => {
                    const active = editDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleToggleDay(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {d.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Tuition Price & Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Price (USD $)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Period
                  </label>
                  <select
                    value={editPricePeriod}
                    onChange={(e) => setEditPricePeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="yr">Per Year</option>
                    <option value="month">Per Month</option>
                    <option value="week">Per Week</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Class Availability</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editIsOffered ? 'Active on Timetable & Form' : 'Archived in Course Bank (Hidden)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsOffered(!editIsOffered)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-bold ${
                    editIsOffered
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {editIsOffered ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{editIsOffered ? 'Active' : 'Archived'}</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
