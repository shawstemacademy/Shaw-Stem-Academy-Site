import React, { useState } from 'react';
import { ClassItem, SbaHubOption, ClassType, Department, SchoolUser, LocationOption } from '../types';
import { formatUSD } from '../lib/formatCurrency';
import { formatPricePeriod } from '../lib/paymentUtils';
import { BatchScheduleModal } from './BatchScheduleModal';
import {
  Database,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Edit,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Link,
  Video,
  BookOpen,
  Tag,
  Percent,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Info,
  X,
  MapPin,
  ArrowUpDown,
  Building2,
  Sparkles,
  Copy,
  RefreshCw,
  Archive,
  ArchiveRestore,
  FolderArchive,
  AlertCircle,
  Check,
} from 'lucide-react';

interface CourseBankManagerProps {
  classList: ClassItem[];
  sbaHubOptions: SbaHubOption[];
  onUpdateClassList: (updatedClasses: ClassItem[]) => void;
  onUpdateSbaHubOptions: (updatedOptions: SbaHubOption[]) => void;
  onClose?: () => void;
  classTypes?: ClassType[];
  departments?: Department[];
  users?: SchoolUser[];
  locations?: LocationOption[];
  onSaveClassType?: (classType: ClassType) => void;
  onDeleteClassType?: (id: string) => void;
  onSaveLocation?: (location: LocationOption) => void;
  onDeleteLocation?: (id: string) => void;
}

export const CourseBankManager: React.FC<CourseBankManagerProps> = ({
  classList,
  sbaHubOptions,
  onUpdateClassList,
  onUpdateSbaHubOptions,
  onClose,
  classTypes = [],
  departments = [],
  users = [],
  locations = [],
  onSaveClassType,
  onDeleteClassType,
  onSaveLocation,
  onDeleteLocation,
}) => {
  const staffMembers = users.filter((u) => u.role !== 'student');
  const defaultInstructor = staffMembers[0]?.name || 'Vacant';
  const getValidInstructor = (name?: string) => {
    if (!name) return 'Vacant';
    if (name === 'Vacant' || name === 'Unassigned') return 'Vacant';
    if (name === 'Staff Instructor' || name === 'Staff SBA Lead') {
      return defaultInstructor || 'Vacant';
    }
    return name;
  };
  const [activeTab, setActiveTab] = useState<'classes' | 'sba'>('classes');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConvertClassesToSba = () => {
    if (selectedIds.length === 0) return;
    
    const classesToConvert = classList.filter((c) => selectedIds.includes(c.id));
    if (classesToConvert.length === 0) return;

    const newSbaHubOptions: SbaHubOption[] = classesToConvert.map((c) => ({
      id: c.id,
      name: c.title,
      classType: c.classType || 'CSEC',
      yearlyPrice: c.price,
      pricePeriod: 'one-time',
      isOffered: c.isOffered ?? true,
      days: c.days || [],
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      instructor: c.instructor || defaultInstructor,
      googleClassroomUrl: c.googleClassroomUrl,
      googleClassroomCode: c.googleClassroomCode,
      googleMeetUrl: c.googleMeetUrl,
      discountType: 'Exempt from Discounts',
    }));

    const updatedClassList = classList.filter((c) => !selectedIds.includes(c.id));
    const updatedSbaHubOptions = [...sbaHubOptions, ...newSbaHubOptions];

    onUpdateClassList(updatedClassList);
    onUpdateSbaHubOptions(updatedSbaHubOptions);
    setSelectedIds([]);
  };

  const handleDuplicateClassesToSba = () => {
    if (selectedIds.length === 0) return;

    const classesToDuplicate = classList.filter((c) => selectedIds.includes(c.id));
    if (classesToDuplicate.length === 0) return;

    const newSbaHubOptions: SbaHubOption[] = classesToDuplicate.map((c, idx) => ({
      id: `sba-dup-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: c.title,
      classType: c.classType || 'CSEC',
      yearlyPrice: c.price,
      pricePeriod: 'one-time',
      isOffered: c.isOffered ?? true,
      days: c.days || [],
      startTime: c.startTime,
      endTime: c.endTime,
      location: c.location,
      instructor: c.instructor || defaultInstructor,
      googleClassroomUrl: c.googleClassroomUrl,
      googleClassroomCode: c.googleClassroomCode,
      googleMeetUrl: c.googleMeetUrl,
      discountType: 'Exempt from Discounts',
    }));

    const updatedSbaHubOptions = [...sbaHubOptions, ...newSbaHubOptions];

    onUpdateSbaHubOptions(updatedSbaHubOptions);
    setSelectedIds([]);
  };

  const handleConvertSbaToClasses = () => {
    if (selectedIds.length === 0) return;

    const sbaToConvert = sbaHubOptions.filter((s) => selectedIds.includes(s.id));
    if (sbaToConvert.length === 0) return;

    const newClasses: ClassItem[] = sbaToConvert.map((s) => {
      const daysStr = s.days && s.days.length > 0 ? s.days.join(', ') : '';
      const timesStr = s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : '';
      const scheduleText = daysStr ? `${daysStr}${timesStr}` : 'Flexible Schedule';

      return {
        id: s.id,
        title: s.name,
        category: departments[0]?.name || 'STEM & Robotics',
        classType: s.classType || 'CSEC',
        instructor: s.instructor || defaultInstructor,
        schedule: scheduleText,
        ageGroup: 'All High School Levels',
        price: s.yearlyPrice,
        pricePeriod: s.pricePeriod || 'yr',
        capacity: 10,
        enrolled: 0,
        location: s.location || 'STEM Lab A',
        description: `SBA Hub course: ${s.name}`,
        isOffered: s.isOffered ?? true,
        days: s.days || [],
        startTime: s.startTime,
        endTime: s.endTime,
        googleClassroomUrl: s.googleClassroomUrl,
        googleClassroomCode: s.googleClassroomCode,
        googleMeetUrl: s.googleMeetUrl,
      };
    });

    const updatedSbaHubOptions = sbaHubOptions.filter((s) => !selectedIds.includes(s.id));
    const updatedClassList = [...classList, ...newClasses];

    onUpdateClassList(updatedClassList);
    onUpdateSbaHubOptions(updatedSbaHubOptions);
    setSelectedIds([]);
  };

  const handleDuplicateSbaToClasses = () => {
    if (selectedIds.length === 0) return;

    const sbaToDuplicate = sbaHubOptions.filter((s) => selectedIds.includes(s.id));
    if (sbaToDuplicate.length === 0) return;

    const newClasses: ClassItem[] = sbaToDuplicate.map((s, idx) => {
      const daysStr = s.days && s.days.length > 0 ? s.days.join(', ') : '';
      const timesStr = s.startTime && s.endTime ? ` (${s.startTime} - ${s.endTime})` : '';
      const scheduleText = daysStr ? `${daysStr}${timesStr}` : 'Flexible Schedule';

      return {
        id: `cls-dup-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: s.name,
        category: departments[0]?.name || 'STEM & Robotics',
        classType: s.classType || 'CSEC',
        instructor: s.instructor || defaultInstructor,
        schedule: scheduleText,
        ageGroup: 'All High School Levels',
        price: s.yearlyPrice,
        pricePeriod: s.pricePeriod || 'yr',
        capacity: 10,
        enrolled: 0,
        location: s.location || 'STEM Lab A',
        description: `SBA Hub course copy: ${s.name}`,
        isOffered: s.isOffered ?? true,
        days: s.days || [],
        startTime: s.startTime,
        endTime: s.endTime,
        googleClassroomUrl: s.googleClassroomUrl,
        googleClassroomCode: s.googleClassroomCode,
        googleMeetUrl: s.googleMeetUrl,
      };
    });

    const updatedClassList = [...classList, ...newClasses];

    onUpdateClassList(updatedClassList);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    if (activeTab === 'classes') {
      const updatedClassList = classList.filter((c) => !selectedIds.includes(c.id));
      onUpdateClassList(updatedClassList);
    } else {
      const updatedSbaHubOptions = sbaHubOptions.filter((s) => !selectedIds.includes(s.id));
      onUpdateSbaHubOptions(updatedSbaHubOptions);
    }
    
    setSelectedIds([]);
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'offered' | 'bank' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMessage, setNotificationMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Batch Archive Selected Courses from Course Bank
  const handleBatchArchive = () => {
    if (selectedIds.length === 0) return;
    const now = new Date().toISOString();
    const count = selectedIds.length;

    if (activeTab === 'classes') {
      const updatedClassList = classList.map((c) =>
        selectedIds.includes(c.id)
          ? { ...c, isArchived: true, isOffered: false, archivedAt: now }
          : c
      );
      onUpdateClassList(updatedClassList);
    } else {
      const updatedSbaHubOptions = sbaHubOptions.map((s) =>
        selectedIds.includes(s.id)
          ? { ...s, isArchived: true, isOffered: false, archivedAt: now }
          : s
      );
      onUpdateSbaHubOptions(updatedSbaHubOptions);
    }

    setNotificationMessage({
      text: `Successfully archived ${count} course${count > 1 ? 's' : ''} from the active Course Bank.`,
      type: 'success',
    });
    setSelectedIds([]);
  };

  // Batch Unarchive / Restore Courses back to Course Bank
  const handleBatchUnarchive = (restoreAsOffered = false) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    if (activeTab === 'classes') {
      const updatedClassList = classList.map((c) =>
        selectedIds.includes(c.id)
          ? { ...c, isArchived: false, isOffered: restoreAsOffered, archivedAt: undefined }
          : c
      );
      onUpdateClassList(updatedClassList);
    } else {
      const updatedSbaHubOptions = sbaHubOptions.map((s) =>
        selectedIds.includes(s.id)
          ? { ...s, isArchived: false, isOffered: restoreAsOffered, archivedAt: undefined }
          : s
      );
      onUpdateSbaHubOptions(updatedSbaHubOptions);
    }

    setNotificationMessage({
      text: `Restored ${count} course${count > 1 ? 's' : ''} back to ${restoreAsOffered ? 'Active Offered Courses' : 'Course Bank'}.`,
      type: 'success',
    });
    setSelectedIds([]);
  };

  // Single Course Archive / Unarchive Toggles
  const handleToggleArchiveClass = (classId: string) => {
    const target = classList.find((c) => c.id === classId);
    if (!target) return;
    const willArchive = !target.isArchived;

    const updated = classList.map((c) =>
      c.id === classId
        ? {
            ...c,
            isArchived: willArchive,
            isOffered: willArchive ? false : c.isOffered,
            archivedAt: willArchive ? new Date().toISOString() : undefined,
          }
        : c
    );
    onUpdateClassList(updated);
    setNotificationMessage({
      text: willArchive
        ? `Archived "${target.title}" from active Course Bank.`
        : `Restored "${target.title}" to Course Bank.`,
      type: 'info',
    });
  };

  const handleToggleArchiveSba = (sbaId: string) => {
    const target = sbaHubOptions.find((s) => s.id === sbaId);
    if (!target) return;
    const willArchive = !target.isArchived;

    const updated = sbaHubOptions.map((s) =>
      s.id === sbaId
        ? {
            ...s,
            isArchived: willArchive,
            isOffered: willArchive ? false : s.isOffered,
            archivedAt: willArchive ? new Date().toISOString() : undefined,
          }
        : s
    );
    onUpdateSbaHubOptions(updated);
    setNotificationMessage({
      text: willArchive
        ? `Archived "${target.name}" from active Course Bank.`
        : `Restored "${target.name}" to Course Bank.`,
      type: 'info',
    });
  };
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'price-asc' | 'price-desc'>('alpha-asc');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [classTypeFilter, setClassTypeFilter] = useState<string>('all');

  // Compute unique department options strictly from active departments in Firestore
  const uniqueDepartmentOptions = departments.map((d) => d.name);

  // Compute unique class type options across active class types & class items
  const activeCtCodes = classTypes.map((ct) => ct.code || ct.name);
  const allCtInClasses = Array.from(new Set(classList.map((c) => c.classType).filter((ct): ct is string => Boolean(ct))));
  const uniqueClassTypeOptions = Array.from(new Set([...activeCtCodes, ...allCtInClasses]));

  // Batch Department Reassignment Helper
  const legacyStemClasses = classList.filter((c) => c.category === 'STEM & Robotics');
  const [batchTargetDept, setBatchTargetDept] = useState<string>('');

  const handleBatchReassignStem = () => {
    const target = batchTargetDept || departments[0]?.name || 'Coding & AI';
    const updated = classList.map((c) =>
      c.category === 'STEM & Robotics' ? { ...c, category: target } : c
    );
    onUpdateClassList(updated);
  };

  // Batch Schedule Modal State
  const [isBatchScheduleModalOpen, setIsBatchScheduleModalOpen] = useState(false);

  // Form Modal for Adding/Editing Course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Location Manager State
  const [customLocations, setCustomLocations] = useState<string[]>([
    'STEM Lab A',
    'Innovation Lab A',
    'Mechatronics Studio',
    'Computer Studio 2',
    'Art Studio B',
    'Music Hall 1',
    'Online SBA Hub',
  ]);
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
  const [newLocNameInput, setNewLocNameInput] = useState('');
  const [newLocBuildingInput, setNewLocBuildingInput] = useState('');
  const [newLocRoomNumberInput, setNewLocRoomNumberInput] = useState('');
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');

  // Dynamically compute list of available locations
  const availableLocations = locations.map((l) => l.name);

  const handleAddCustomLocation = (locationName: string, building?: string, roomNumber?: string) => {
    const trimmed = locationName.trim();
    if (!trimmed) return;
    if (onSaveLocation) {
      onSaveLocation({
        id: `loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: trimmed,
        building: building?.trim() || undefined,
        roomNumber: roomNumber?.trim() || undefined,
      });
    } else if (!customLocations.includes(trimmed)) {
      setCustomLocations((prev) => [...prev, trimmed]);
    }
  };

  const handleDeleteCustomLocation = (locToDelete: string) => {
    if (onDeleteLocation && locations.length > 0) {
      const match = locations.find((l) => l.name === locToDelete || l.id === locToDelete);
      if (match) {
        onDeleteLocation(match.id);
        return;
      }
    }
    setCustomLocations((prev) => prev.filter((l) => l !== locToDelete));
  };

  // Class Types Manager State
  const [isClassTypesModalOpen, setIsClassTypesModalOpen] = useState(false);
  const [editingCtId, setEditingCtId] = useState<string | null>(null);
  const [ctNameInput, setCtNameInput] = useState('');
  const [ctCodeInput, setCtCodeInput] = useState('');
  const [ctDescInput, setCtDescInput] = useState('');

  const handleSaveClassTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctNameInput.trim() || !ctCodeInput.trim()) return;

    const updatedCt: ClassType = {
      id: editingCtId || `ct-${Date.now()}`,
      name: ctNameInput.trim(),
      code: ctCodeInput.trim().toUpperCase(),
      description: ctDescInput.trim() || `${ctNameInput.trim()} Class Type`,
      isSbaHub: false,
    };

    if (onSaveClassType) {
      onSaveClassType(updatedCt);
    }
    setEditingCtId(null);
    setCtNameInput('');
    setCtCodeInput('');
    setCtDescInput('');
  };

  const handleEditCtClick = (ct: ClassType) => {
    setEditingCtId(ct.id);
    setCtNameInput(ct.name);
    setCtCodeInput(ct.code);
    setCtDescInput(ct.description || '');
  };

  const cancelCtEdit = () => {
    setEditingCtId(null);
    setCtNameInput('');
    setCtCodeInput('');
    setCtDescInput('');
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ClassItem['category']>(departments[0]?.name || 'STEM & Robotics');
  const [selectedClassType, setSelectedClassType] = useState<string>('CSEC');
  const [sbaDiscountType, setSbaDiscountType] = useState<string>('Exempt from Discounts');
  const [customDiscountInput, setCustomDiscountInput] = useState<string>('');
  const [price, setPrice] = useState<number>(100);
  const [pricePeriod, setPricePeriod] = useState<'yr' | 'week' | 'month' | 'one-time'>('yr');
  const [instructor, setInstructor] = useState(defaultInstructor);
  const [location, setLocation] = useState('STEM Lab A');
  const [daysInput, setDaysInput] = useState<string[]>(['Monday', 'Wednesday']);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [isOffered, setIsOffered] = useState(true);
  const [gcUrl, setGcUrl] = useState('');
  const [gcCode, setGcCode] = useState('');
  const [gMeetUrl, setGMeetUrl] = useState('');
  const [capacity, setCapacity] = useState<number>(15);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Toggle Offered Status for Regular Class
  const handleToggleClassOffered = (classId: string) => {
    const updated = classList.map((c) =>
      c.id === classId ? { ...c, isOffered: c.isOffered === false ? true : false } : c
    );
    onUpdateClassList(updated);
  };

  // Toggle Offered Status for SBA Option
  const handleToggleSbaOffered = (sbaId: string) => {
    const updated = sbaHubOptions.map((s) =>
      s.id === sbaId ? { ...s, isOffered: s.isOffered === false ? true : false } : s
    );
    onUpdateSbaHubOptions(updated);
  };

  // Open Edit Modal
  const handleOpenEditClass = (c: ClassItem) => {
    setEditingItemId(c.id);
    setTitle(c.title);
    setCategory(c.category);
    setSelectedClassType(c.classType || (c.title.toUpperCase().includes('CAPE') ? 'CAPE' : 'CSEC'));
    setPrice(c.price);
    setPricePeriod(c.pricePeriod || 'yr');
    setInstructor(getValidInstructor(c.instructor));
    setLocation(c.location || availableLocations[0] || 'STEM Lab A');
    setIsAddingNewLocation(false);
    setCustomLocationInput('');
    setDaysInput(c.days && c.days.length > 0 ? c.days : ['Monday', 'Wednesday']);
    setStartTime(c.startTime || '16:00');
    setEndTime(c.endTime || '17:30');
    setIsOffered(c.isOffered !== false);
    setGcUrl(c.googleClassroomUrl || '');
    setGcCode(c.googleClassroomCode || '');
    setGMeetUrl(c.googleMeetUrl || '');
    setCapacity(c.capacity || 15);
    setIsModalOpen(true);
  };

  const handleOpenEditSba = (s: SbaHubOption) => {
    setEditingItemId(s.id);
    setTitle(s.name);
    setSelectedClassType(s.classType || s.discountType || s.level || (classTypes[0]?.code || classTypes[0]?.name || 'CSEC'));
    setPrice(s.yearlyPrice);
    setPricePeriod(s.pricePeriod || 'one-time');
    setInstructor(getValidInstructor(s.instructor));
    setLocation(s.location || 'Online SBA Hub');
    setIsAddingNewLocation(false);
    setCustomLocationInput('');
    setDaysInput(s.days && s.days.length > 0 ? s.days : ['Friday']);
    setStartTime(s.startTime || '16:00');
    setEndTime(s.endTime || '18:00');
    setIsOffered(s.isOffered !== false);
    setGcUrl(s.googleClassroomUrl || '');
    setGcCode(s.googleClassroomCode || '');
    setGMeetUrl(s.googleMeetUrl || '');
    setCapacity(s.capacity || 15);
    setIsModalOpen(true);
  };

  const handleOpenNewItem = () => {
    setEditingItemId(null);
    setTitle('');
    setCategory(departments[0]?.name || 'STEM & Robotics');
    setSelectedClassType('CSEC');
    setSbaDiscountType('Exempt from Discounts');
    setCustomDiscountInput('');
    setPrice(activeTab === 'classes' ? 100 : 150);
    setPricePeriod(activeTab === 'classes' ? 'month' : 'one-time');
    setInstructor(defaultInstructor);
    setLocation(availableLocations[0] || 'STEM Lab A');
    setIsAddingNewLocation(false);
    setCustomLocationInput('');
    setDaysInput(['Monday', 'Wednesday']);
    setStartTime('16:00');
    setEndTime('17:30');
    setIsOffered(true);
    setGcUrl('');
    setGcCode('');
    setGMeetUrl('');
    setCapacity(15);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const daysStr = daysInput.join(' & ');
    const schedText = `${daysStr} ${startTime} - ${endTime}`;
    const finalSbaDiscountType =
      sbaDiscountType === 'Custom Discount'
        ? customDiscountInput.trim() || 'Custom Discount'
        : sbaDiscountType;

    const isSbaClass = classTypes.find(ct => ct.code === selectedClassType || ct.name === selectedClassType)?.isSbaHub || selectedClassType === 'SBA_HUB' || selectedClassType === 'SBA';
    const finalPricePeriod = isSbaClass ? 'one-time' : pricePeriod;

    if (activeTab === 'classes') {
      if (editingItemId) {
        const updated = classList.map((c) =>
          c.id === editingItemId
            ? {
                ...c,
                title: title.trim(),
                category,
                classType: selectedClassType,
                price: Number(price) || 100,
                pricePeriod: finalPricePeriod as any,
                instructor: instructor.trim() || defaultInstructor,
                location: location.trim() || 'STEM Lab A',
                days: daysInput,
                startTime,
                endTime,
                schedule: schedText,
                isOffered,
                capacity: Number(capacity) || 10,
                googleClassroomUrl: gcUrl.trim() || undefined,
                googleClassroomCode: gcCode.trim() || undefined,
                googleMeetUrl: gMeetUrl.trim() || undefined,
              }
            : c
        );
        onUpdateClassList(updated);
      } else {
        const newClass: ClassItem = {
          id: `cls-bank-${Date.now()}`,
          title: title.trim(),
          category,
          classType: selectedClassType,
          price: Number(price) || 100,
          pricePeriod: finalPricePeriod as any,
          instructor: instructor.trim() || defaultInstructor,
          schedule: schedText,
          ageGroup: 'All High School Levels',
          capacity: Number(capacity) || 10,
          enrolled: 0,
          location: location.trim() || 'STEM Lab A',
          description: `Comprehensive course covering ${title.trim()} modules and hands-on projects.`,
          isOffered,
          days: daysInput,
          startTime,
          endTime,
          googleClassroomUrl: gcUrl.trim() || undefined,
          googleClassroomCode: gcCode.trim() || undefined,
          googleMeetUrl: gMeetUrl.trim() || undefined,
        };
        onUpdateClassList([...classList, newClass]);
      }
    } else {
      if (editingItemId) {
        const updated = sbaHubOptions.map((s) =>
          s.id === editingItemId
            ? {
                ...s,
                name: title.trim(),
                classType: selectedClassType,
                discountType: selectedClassType,
                yearlyPrice: Number(price) || 150,
                pricePeriod: 'one-time',
                instructor: instructor.trim() || defaultInstructor,
                location: location.trim() || 'Online SBA Hub',
                days: daysInput,
                startTime,
                endTime,
                isOffered,
                capacity: Number(capacity) || 10,
                googleClassroomUrl: gcUrl.trim() || undefined,
                googleClassroomCode: gcCode.trim() || undefined,
                googleMeetUrl: gMeetUrl.trim() || undefined,
              }
            : s
        );
        onUpdateSbaHubOptions(updated);
      } else {
        const newSba: SbaHubOption = {
          id: `sba-bank-${Date.now()}`,
          name: title.trim(),
          classType: selectedClassType,
          discountType: selectedClassType,
          yearlyPrice: Number(price) || 150,
          pricePeriod: 'one-time',
          instructor: instructor.trim() || defaultInstructor,
          location: location.trim() || 'Online SBA Hub',
          days: daysInput,
          startTime,
          endTime,
          isOffered,
          capacity: Number(capacity) || 10,
          googleClassroomUrl: gcUrl.trim() || undefined,
          googleClassroomCode: gcCode.trim() || undefined,
          googleMeetUrl: gMeetUrl.trim() || undefined,
        };
        onUpdateSbaHubOptions([...sbaHubOptions, newSba]);
      }
    }

    setIsModalOpen(false);
  };

  const toggleDaySelection = (day: string) => {
    setDaysInput((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Filter & Sort logic
  const filteredClasses = (classList || [])
    .filter((c) => {
      if (!c) return false;
      const isOff = c.isOffered !== false;
      const isArchived = Boolean(c.isArchived);

      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = !isArchived;
      } else if (statusFilter === 'offered') {
        matchesStatus = !isArchived && isOff;
      } else if (statusFilter === 'bank') {
        matchesStatus = !isArchived && !isOff;
      } else if (statusFilter === 'archived') {
        matchesStatus = isArchived;
      }

      const matchesSearch =
        (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.instructor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept =
        departmentFilter === 'all' || c.category === departmentFilter;
      const matchesCt =
        classTypeFilter === 'all' || c.classType === classTypeFilter;

      return matchesStatus && matchesSearch && matchesDept && matchesCt;
    })
    .sort((a, b) => {
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

  const filteredSba = (sbaHubOptions || [])
    .filter((s) => {
      if (!s) return false;
      const isOff = s.isOffered !== false;
      const isArchived = Boolean(s.isArchived);

      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = !isArchived;
      } else if (statusFilter === 'offered') {
        matchesStatus = !isArchived && isOff;
      } else if (statusFilter === 'bank') {
        matchesStatus = !isArchived && !isOff;
      } else if (statusFilter === 'archived') {
        matchesStatus = isArchived;
      }

      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.instructor || '').toLowerCase().includes(searchTerm.toLowerCase());
      const ctVal = s.classType || s.discountType || s.level || '';
      const matchesCt =
        classTypeFilter === 'all' ||
        ctVal.toLowerCase() === classTypeFilter.toLowerCase() ||
        ctVal.toLowerCase().includes(classTypeFilter.toLowerCase());

      return matchesStatus && matchesSearch && matchesCt;
    })
    .sort((a, b) => {
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

  const currentList = activeTab === 'classes' ? filteredClasses : filteredSba;
  const allCurrentIdsSelected = currentList.length > 0 && currentList.every((item) => selectedIds.includes(item.id));

  const handleSelectAllToggle = () => {
    if (allCurrentIdsSelected) {
      const currentListIds = currentList.map((item) => item.id);
      setSelectedIds((prev) => prev.filter((id) => !currentListIds.includes(id)));
    } else {
      const currentListIds = currentList.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentListIds])));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">Course Bank Repository</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Central repository of all academic courses & SBA Hub subjects. Tag courses as <strong>Offered</strong> to populate student registration forms.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsBatchScheduleModalOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Batch Schedule Classes and Courses"
          >
            <Calendar className="w-4 h-4 text-purple-200" />
            <span>Batch Schedule</span>
          </button>
          <button
            onClick={() => setIsLocationsModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>Manage Locations ({availableLocations.length})</span>
          </button>
          <button
            onClick={() => setIsClassTypesModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4 text-purple-400" />
            <span>Manage Class Types ({classTypes.length})</span>
          </button>
          <button
            onClick={handleOpenNewItem}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course to Bank</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Notification Banner */}
        {notificationMessage && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
              notificationMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notificationMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <p className="text-xs font-bold">{notificationMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationMessage(null)}
              className="text-xs font-semibold p-1 hover:bg-black/5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('classes');
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'classes'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Regular Classes Bank ({classList.filter((c) => !c.isArchived).length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('sba');
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sba'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>SBA Hub Courses Bank ({sbaHubOptions.filter((s) => !s.isArchived).length})</span>
            </button>
          </div>

          {/* Offering & Archive Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Courses ({activeTab === 'classes' ? classList.filter((c) => !c.isArchived).length : sbaHubOptions.filter((s) => !s.isArchived).length})
            </button>
            <button
              onClick={() => setStatusFilter('offered')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'offered'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Offered in Form ({activeTab === 'classes' ? classList.filter((c) => !c.isArchived && c.isOffered !== false).length : sbaHubOptions.filter((s) => !s.isArchived && s.isOffered !== false).length})
            </button>
            <button
              onClick={() => setStatusFilter('bank')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'bank'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bank Only ({activeTab === 'classes' ? classList.filter((c) => !c.isArchived && c.isOffered === false).length : sbaHubOptions.filter((s) => !s.isArchived && s.isOffered === false).length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'archived'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Archive className="w-3 h-3 text-amber-600" />
              <span>Archived ({activeTab === 'classes' ? classList.filter((c) => Boolean(c.isArchived)).length : sbaHubOptions.filter((s) => Boolean(s.isArchived)).length})</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Controls Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by course title, instructor, or department..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
              />
            </div>

            {/* Dropdown Filters & Sorting */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shrink-0 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="alpha-asc">Alphabetical (A - Z)</option>
                  <option value="alpha-desc">Alphabetical (Z - A)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>

              {/* Department Filter */}
              {activeTab === 'classes' && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shrink-0 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">Dept:</span>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="all">All Departments ({uniqueDepartmentOptions.length})</option>
                    {uniqueDepartmentOptions.map((deptName) => (
                      <option key={deptName} value={deptName}>
                        {deptName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Type Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shrink-0 shadow-2xs">
                <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Class Type:</span>
                <select
                  value={classTypeFilter}
                  onChange={(e) => setClassTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Class Types ({uniqueClassTypeOptions.length})</option>
                  {uniqueClassTypeOptions.map((ctCode) => (
                    <option key={ctCode} value={ctCode}>
                      {ctCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(departmentFilter !== 'all' || classTypeFilter !== 'all' || searchTerm !== '' || sortOrder !== 'alpha-asc') && (
                <button
                  type="button"
                  onClick={() => {
                    setDepartmentFilter('all');
                    setClassTypeFilter('all');
                    setSearchTerm('');
                    setSortOrder('alpha-asc');
                  }}
                  className="px-2.5 py-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer shrink-0"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Legacy "STEM & Robotics" Department Alignment Banner */}
        {activeTab === 'classes' && legacyStemClasses.length > 0 && (
          <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-purple-900">
                  Department Alignment Needed ({legacyStemClasses.length} course{legacyStemClasses.length > 1 ? 's' : ''} tagged with "STEM & Robotics")
                </p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Reassign them all to an active department in 1 click without remaking any courses:
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <select
                value={batchTargetDept || (departments[0]?.name || '')}
                onChange={(e) => setBatchTargetDept(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-purple-900"
              >
                {departments.length > 0 ? (
                  departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Coding & AI">Coding & AI</option>
                    <option value="Arts & Design">Arts & Design</option>
                    <option value="Languages & Music">Languages & Music</option>
                  </>
                )}
              </select>
              <button
                type="button"
                onClick={handleBatchReassignStem}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Reassign All {legacyStemClasses.length} Courses
              </button>
            </div>
          </div>
        )}



        {/* Bulk Selection and Conversion Action Bar */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="select-all-courses"
              checked={allCurrentIdsSelected}
              onChange={handleSelectAllToggle}
              className="w-4 h-4 rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="select-all-courses" className="text-xs font-bold text-slate-700 cursor-pointer">
              Select All Current ({currentList.length})
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                {selectedIds.length} Selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              {statusFilter === 'archived' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleBatchUnarchive(false)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Restore selected courses to active Course Bank"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Restore to Bank ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchUnarchive(true)}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Restore selected courses and tag them as Offered in student registration forms"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Restore & Offer ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected archived courses?`)) {
                        handleDeleteSelected();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Delete selected courses permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                </>
              ) : activeTab === 'classes' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBatchScheduleModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Batch Schedule selected classes"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Batch Schedule ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertClassesToSba}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Move selected classes to SBA Hub"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Convert to SBA Hub ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicateClassesToSba}
                    className="px-3.5 py-1.5 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Duplicate selected classes to SBA Hub"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate to SBA Hub ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchArchive}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Batch Archive selected classes from Course Bank"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Batch Archive ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected classes?`)) {
                        handleDeleteSelected();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Delete selected classes"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsBatchScheduleModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Batch Schedule selected SBA Hub courses"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Batch Schedule ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertSbaToClasses}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Move selected SBA Hub options to Regular Classes"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Convert to Regular ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicateSbaToClasses}
                    className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Duplicate selected SBA Hub options to Regular Classes"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate to Regular ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchArchive}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Batch Archive selected SBA courses from Course Bank"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Batch Archive ({selectedIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected SBA options?`)) {
                        handleDeleteSelected();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                    title="Delete selected SBA options"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Course List Display */}
        {activeTab === 'classes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClasses.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {statusFilter === 'archived'
                    ? 'No archived regular classes found'
                    : 'No courses match your filter criteria'}
                </p>
                <p className="text-xs text-slate-500">
                  {statusFilter === 'archived'
                    ? 'Courses archived from the course bank will appear here and can be restored at any time.'
                    : 'Try adjusting your department filter, class type filter, or search query.'}
                </p>
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const isOfferedNow = cls.isOffered !== false;
                const isArchived = Boolean(cls.isArchived);

                return (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isArchived
                        ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                        : isOfferedNow
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-purple-300'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {/* Individual Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(cls.id)}
                            onChange={() => toggleSelection(cls.id)}
                            className="w-4 h-4 mt-1 rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                            title="Select course for bulk actions"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isArchived ? (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Archive className="w-2.5 h-2.5" />
                                  <span>Archived in Bank</span>
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                                    isOfferedNow
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isOfferedNow ? 'Offered in Form' : 'In Course Bank'}
                                </span>
                              )}

                              {cls.classType && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                                  {cls.classType}
                                </span>
                              )}

                              {/* Quick Inline Department Reassignment Selector */}
                              <select
                                value={cls.category}
                                onChange={(e) => {
                                  const newCat = e.target.value;
                                  const updated = classList.map((item) =>
                                    item.id === cls.id ? { ...item, category: newCat } : item
                                  );
                                  onUpdateClassList(updated);
                                }}
                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-purple-500 ${
                                  cls.category === 'STEM & Robotics'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                    : 'bg-blue-50 text-blue-800 border-blue-200 font-semibold'
                                }`}
                                title="Click to quickly reassign department"
                              >
                                {!uniqueDepartmentOptions.includes(cls.category) && (
                                  <option value={cls.category}>{cls.category}</option>
                                )}
                                {uniqueDepartmentOptions.map((dName) => (
                                  <option key={dName} value={dName}>
                                    {dName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5">{cls.title}</h3>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-purple-700 shrink-0">
                          {formatUSD(cls.price)}
                          {!(cls.isSbaHub || cls.classType === 'SBA_HUB' || cls.classType === 'SBA' || classTypes.find(ct => ct.code === cls.classType || ct.name === cls.classType)?.isSbaHub) && ` ${formatPricePeriod(cls.pricePeriod)}`}
                        </span>
                      </div>

                    <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{cls.schedule || 'Flexible Schedule'}</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-500 flex-wrap pt-1 border-t border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-600">Teacher:</span>
                        <select
                          value={getValidInstructor(cls.instructor)}
                          onChange={(e) => {
                            const newInstructor = e.target.value;
                            const updated = classList.map((item) =>
                              item.id === cls.id ? { ...item, instructor: newInstructor } : item
                            );
                            onUpdateClassList(updated);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="Vacant">Vacant (Unassigned)</option>
                          {!staffMembers.some((u) => u.name === getValidInstructor(cls.instructor)) && getValidInstructor(cls.instructor) && getValidInstructor(cls.instructor) !== 'Vacant' && (
                            <option value={getValidInstructor(cls.instructor)}>{getValidInstructor(cls.instructor)}</option>
                          )}
                          {staffMembers.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-slate-600">Loc:</span>
                        <select
                          value={cls.location || 'Vacant'}
                          onChange={(e) => {
                            const newLocation = e.target.value;
                            const updated = classList.map((item) =>
                              item.id === cls.id ? { ...item, location: newLocation } : item
                            );
                            onUpdateClassList(updated);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-purple-500 max-w-[120px] truncate"
                        >
                          <option value="Vacant">TBA</option>
                          {!availableLocations.includes(cls.location || '') && cls.location && cls.location !== 'Vacant' && cls.location !== 'TBA' && (
                            <option value={cls.location}>{cls.location}</option>
                          )}
                          {availableLocations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Google Classroom Details */}
                    {(cls.googleClassroomUrl || cls.googleMeetUrl) && (
                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-blue-900 flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span>Google Classroom Configured</span>
                        </p>
                        {cls.googleClassroomCode && (
                          <p className="text-[11px] text-blue-800 font-mono">
                            Class Code: <strong>{cls.googleClassroomCode}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    {isArchived ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleArchiveClass(cls.id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Restore this course to active Course Bank"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restore to Bank</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = classList.map((c) =>
                              c.id === cls.id ? { ...c, isArchived: false, isOffered: true, archivedAt: undefined } : c
                            );
                            onUpdateClassList(updated);
                            setNotificationMessage({
                              text: `Restored "${cls.title}" and tagged as Offered.`,
                              type: 'success',
                            });
                          }}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Restore and immediately tag as Offered in registration forms"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Restore & Offer</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleClassOffered(cls.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isOfferedNow
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isOfferedNow ? <ToggleRight className="w-4 h-4 text-amber-600" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{isOfferedNow ? 'Untag (In Bank Only)' : 'Tag as Offered'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleArchiveClass(cls.id)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Archive this course from active Course Bank"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSba.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Tag className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  {statusFilter === 'archived'
                    ? 'No archived SBA Hub courses found'
                    : 'No SBA Hub courses match your filter criteria'}
                </p>
                <p className="text-xs text-slate-500">
                  {statusFilter === 'archived'
                    ? 'SBA courses archived from the course bank will appear here and can be restored at any time.'
                    : 'Try adjusting your class type filter or search query.'}
                </p>
              </div>
            ) : (
              filteredSba.map((sba) => {
                const isOfferedNow = sba.isOffered !== false;
                const isArchived = Boolean(sba.isArchived);

                return (
                  <div
                    key={sba.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isArchived
                        ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                        : isOfferedNow
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-purple-300'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {/* Individual Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sba.id)}
                            onChange={() => toggleSelection(sba.id)}
                            className="w-4 h-4 mt-1 rounded-sm border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                            title="Select course for bulk actions"
                          />
                          <div>
                            {isArchived ? (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Archive className="w-2.5 h-2.5" />
                                <span>Archived in Bank</span>
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                                  isOfferedNow
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isOfferedNow ? 'Offered in Form' : 'In Course Bank'}
                              </span>
                            )}
                            <h3 className="text-sm font-bold text-slate-900 mt-1">{sba.name}</h3>
                            <p className="text-xs font-semibold mt-0.5 inline-flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                              <Tag className="w-3 h-3 text-purple-600" />
                              <span>Class Type: {sba.classType || sba.discountType || sba.level || 'CSEC'}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-purple-700 shrink-0">{formatUSD(sba.yearlyPrice)}</span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                        <p className="font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Schedule: {(sba.days || []).join(', ') || 'Weekly'} {sba.startTime || '16:00'}-{sba.endTime || '18:00'}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-slate-500 flex-wrap pt-1 border-t border-slate-200/60">
                          <span className="text-[11px] font-semibold text-slate-600">Teacher:</span>
                          <select
                            value={getValidInstructor(sba.instructor)}
                            onChange={(e) => {
                              const newInstructor = e.target.value;
                              const updated = sbaHubOptions.map((item) =>
                                item.id === sba.id ? { ...item, instructor: newInstructor } : item
                              );
                              onUpdateSbaHubOptions(updated);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="Vacant">Vacant (Unassigned)</option>
                            {!staffMembers.some((u) => u.name === getValidInstructor(sba.instructor)) && getValidInstructor(sba.instructor) && getValidInstructor(sba.instructor) !== 'Vacant' && (
                              <option value={getValidInstructor(sba.instructor)}>{getValidInstructor(sba.instructor)}</option>
                            )}
                            {staffMembers.map((u) => (
                              <option key={u.id} value={u.name}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] font-semibold text-slate-600">Loc:</span>
                          <select
                            value={sba.location || 'Vacant'}
                            onChange={(e) => {
                              const newLocation = e.target.value;
                              const updated = sbaHubOptions.map((item) =>
                                item.id === sba.id ? { ...item, location: newLocation } : item
                              );
                              onUpdateSbaHubOptions(updated);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-purple-500 max-w-[120px] truncate"
                          >
                            <option value="Vacant">Online SBA Hub</option>
                            {!availableLocations.includes(sba.location || '') && sba.location && sba.location !== 'Vacant' && sba.location !== 'Online SBA Hub' && (
                              <option value={sba.location}>{sba.location}</option>
                            )}
                            {availableLocations.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      {isArchived ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleArchiveSba(sba.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Restore this SBA course to active Course Bank"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restore to Bank</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = sbaHubOptions.map((s) =>
                                s.id === sba.id ? { ...s, isArchived: false, isOffered: true, archivedAt: undefined } : s
                              );
                              onUpdateSbaHubOptions(updated);
                              setNotificationMessage({
                                text: `Restored "${sba.name}" and tagged as Offered.`,
                                type: 'success',
                              });
                            }}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Restore and immediately tag as Offered in registration forms"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Restore & Offer</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleSbaOffered(sba.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              isOfferedNow
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isOfferedNow ? <ToggleRight className="w-4 h-4 text-amber-600" /> : <ToggleLeft className="w-4 h-4" />}
                            <span>{isOfferedNow ? 'Untag (In Bank Only)' : 'Tag as Offered'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleArchiveSba(sba.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            title="Archive this SBA course from active Course Bank"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenEditSba(sba)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Course Bank Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 my-8">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItemId ? 'Edit Course in Bank' : 'Add New Course to Bank'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title / Subject Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CSEC Physics or CAPE Unit 1 Chemistry SBA"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {activeTab === 'classes' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                    >
                      {/* Preserve legacy category as option if not in current departments */}
                      {category && !departments.some((d) => d.name === category) && (
                        <option value={category}>{category} (Legacy)</option>
                      )}
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">Class Type (Discount Group)</label>
                    <select
                      value={selectedClassType}
                      onChange={(e) => setSelectedClassType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-purple-300 font-bold text-purple-900 bg-purple-50/50 rounded-xl focus:ring-2 focus:ring-purple-500"
                    >
                      {classTypes.map((ct) => (
                        <option key={ct.id} value={ct.code || ct.name}>
                          {ct.name} ({ct.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Class Type (Discount Group)</span>
                  </label>
                  <select
                    value={selectedClassType}
                    onChange={(e) => setSelectedClassType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-purple-300 font-bold text-purple-900 bg-purple-50/50 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    {classTypes.map((ct) => (
                      <option key={ct.id} value={ct.code || ct.name}>
                        {ct.name} ({ct.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select the class type / discount category for this SBA Hub course.
                  </p>
                </div>
              )}

              {activeTab === 'classes' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fee ($ USD)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  {!(classTypes.find(ct => ct.code === selectedClassType || ct.name === selectedClassType)?.isSbaHub || selectedClassType === 'SBA_HUB' || selectedClassType === 'SBA') ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price Period</label>
                      <select
                        value={pricePeriod}
                        onChange={(e) => setPricePeriod(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800"
                      >
                        <option value="month">/ month (Monthly)</option>
                        <option value="week">/ week (Weekly)</option>
                        <option value="yr">/ year (Yearly)</option>
                        <option value="one-time">One-time Payment</option>
                      </select>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-2 border border-slate-200 rounded-xl">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Price Period</label>
                      <span className="text-xs font-extrabold text-purple-700">One-time Payment</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instructor / Supervisor</label>
                    {staffMembers.length > 0 ? (
                      <select
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="Vacant">Vacant (Unassigned)</option>
                        {!staffMembers.some((u) => u.name === instructor) && instructor && instructor !== 'Vacant' && (
                          <option value={instructor}>{instructor}</option>
                        )}
                        {staffMembers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fee ($ USD)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instructor / Supervisor</label>
                    {staffMembers.length > 0 ? (
                      <select
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="Vacant">Vacant (Unassigned)</option>
                        {!staffMembers.some((u) => u.name === instructor) && instructor && instructor !== 'Vacant' && (
                          <option value={instructor}>{instructor}</option>
                        )}
                        {staffMembers.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Location Selection & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Location / Room / Studio</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewLocation(!isAddingNewLocation)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingNewLocation ? 'Select from List' : '+ Add New Location'}</span>
                    </button>
                  </div>

                  {isAddingNewLocation ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Physics Lab 3 or Virtual Studio B"
                        value={customLocationInput}
                        onChange={(e) => {
                          setCustomLocationInput(e.target.value);
                          setLocation(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customLocationInput.trim()) {
                            handleAddCustomLocation(customLocationInput.trim());
                            setLocation(customLocationInput.trim());
                            setIsAddingNewLocation(false);
                          }
                        }}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shrink-0"
                      >
                        Save Location
                      </button>
                    </div>
                  ) : (
                    <select
                      value={location}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewLocation(true);
                          setCustomLocationInput('');
                        } else {
                          setLocation(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold text-slate-800"
                    >
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                      <option value="__add_new__">+ Create New Location...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Class Size (Capacity)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                    placeholder="e.g. 10"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Maximum capacity limit checked during student registration.
                  </p>
                </div>
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map((d) => {
                    const selected = daysInput.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDaySelection(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selected
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Google Classroom Fields */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2">
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Classroom & Video Link Config</span>
                </p>
                <div>
                  <input
                    type="url"
                    value={gcUrl}
                    onChange={(e) => setGcUrl(e.target.value)}
                    placeholder="Google Classroom URL (e.g. https://classroom.google.com/c/...)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={gcCode}
                    onChange={(e) => setGcCode(e.target.value)}
                    placeholder="Classroom Code (e.g. phys-4b)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="url"
                    value={gMeetUrl}
                    onChange={(e) => setGMeetUrl(e.target.value)}
                    placeholder="Google Meet Link"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Offered Tag Checkbox */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-900">Currently Offered Tag</p>
                  <p className="text-[11px] text-emerald-700">Check to publish this course to the student registration forms.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isOffered}
                  onChange={(e) => setIsOffered(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save to Course Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS TYPES MANAGEMENT MODAL */}
      {isClassTypesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Platform Class Types Manager</h3>
              </div>
              <button
                onClick={() => setIsClassTypesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Manage class types (e.g., CSEC, CAPE, Primary, Lower Secondary). Class types are used in Course Bank Manager and across the platform for categorization and multi-class discounts.
            </p>

            {/* List of current class types */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {classTypes.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No custom class types configured yet. Add your first class type below!
                </div>
              ) : (
                classTypes.map((ct) => (
                  <div
                    key={ct.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ct.name}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-full border border-purple-200">
                          {ct.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ct.description}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCtClick(ct)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit Class Type"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {onDeleteClassType && (
                        <button
                          onClick={() => onDeleteClassType(ct.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Class Type"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to add or edit class type */}
            <form onSubmit={handleSaveClassTypeSubmit} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                <span>{editingCtId ? 'Edit Class Type' : 'Add New Class Type'}</span>
                {editingCtId && (
                  <button
                    type="button"
                    onClick={cancelCtEdit}
                    className="text-[11px] text-purple-700 underline font-normal"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSEC or Primary"
                    value={ctNameInput}
                    onChange={(e) => setCtNameInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    System Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSEC"
                    value={ctCodeInput}
                    onChange={(e) => setCtCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. CXC Secondary Level Classes"
                  value={ctDescInput}
                  onChange={(e) => setCtDescInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                {editingCtId ? 'Update Class Type' : 'Create Class Type'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOCATIONS MANAGEMENT MODAL */}
      {isLocationsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Campus & Studio Locations Manager</h3>
              </div>
              <button
                onClick={() => setIsLocationsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Manage physical labs, classrooms, and online spaces available for course assignment across the academy.
            </p>

            {/* List of current locations */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(locations.length > 0
                ? locations
                : availableLocations.map((name, idx) => ({ id: `loc-temp-${idx}`, name }))
              ).map((locItem) => {
                const isDeptRoom = departments.some((d) => d.room === locItem.name);
                return (
                  <div
                    key={locItem.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">{locItem.name}</span>
                        {isDeptRoom && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                            Dept Room
                          </span>
                        )}
                      </div>
                      {(locItem.building || locItem.roomNumber) && (
                        <div className="pl-6 text-[10px] text-slate-500 font-medium">
                          {locItem.building ? `Building: ${locItem.building}` : ''}
                          {locItem.building && locItem.roomNumber ? ' | ' : ''}
                          {locItem.roomNumber ? `Room: ${locItem.roomNumber}` : ''}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteLocation && !locItem.id.startsWith('loc-temp-')) {
                          onDeleteLocation(locItem.id);
                        } else {
                          handleDeleteCustomLocation(locItem.name);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Form to add a new location */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newLocNameInput.trim()) {
                  handleAddCustomLocation(newLocNameInput.trim(), newLocBuildingInput, newLocRoomNumberInput);
                  setNewLocNameInput('');
                  setNewLocBuildingInput('');
                  setNewLocRoomNumberInput('');
                }
              }}
              className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3"
            >
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Add New Campus Location / Room
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Location Name (e.g. Physics Lab 3)"
                  value={newLocNameInput}
                  onChange={(e) => setNewLocNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium bg-white"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Building (Optional)"
                    value={newLocBuildingInput}
                    onChange={(e) => setNewLocBuildingInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Room (Optional)"
                    value={newLocRoomNumberInput}
                    onChange={(e) => setNewLocRoomNumberInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium bg-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    Add Location
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Schedule Modal */}
      <BatchScheduleModal
        isOpen={isBatchScheduleModalOpen}
        onClose={() => setIsBatchScheduleModalOpen(false)}
        targetType={activeTab === 'classes' ? 'classes' : 'sba'}
        selectedClasses={selectedIds.length > 0 ? classList.filter((c) => selectedIds.includes(c.id)) : classList}
        selectedSbaOptions={selectedIds.length > 0 ? sbaHubOptions.filter((s) => selectedIds.includes(s.id)) : sbaHubOptions}
        allClasses={classList}
        allSbaOptions={sbaHubOptions}
        locations={locations || []}
        schoolUsers={users || []}
        onApplyClasses={(updated) => {
          onUpdateClassList(updated);
        }}
        onApplySbaOptions={(updated) => {
          onUpdateSbaHubOptions(updated);
        }}
      />
    </div>
  );
};
