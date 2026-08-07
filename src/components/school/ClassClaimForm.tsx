import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  XCircle, 
  Download, 
  Users, 
  Award,
  Check,
  Lock,
  Edit3,
  Building2,
  Sparkles,
  BellRing
} from 'lucide-react';
import { 
  ClassItem, 
  SbaHubOption, 
  ClassClaimItem, 
  TeacherHourlyRate, 
  SchoolUser, 
  TeacherProfile,
  UserRole 
} from '../../types';

interface ClassClaimFormProps {
  currentUser: SchoolUser | TeacherProfile | null;
  currentRole: UserRole;
  classList: ClassItem[];
  sbaHubOptions?: SbaHubOption[];
  claims: ClassClaimItem[];
  onUpdateClaims: (updatedClaims: ClassClaimItem[]) => void;
  hourlyRates?: TeacherHourlyRate[];
  onUpdateHourlyRates?: (updatedRates: TeacherHourlyRate[]) => void;
  users?: SchoolUser[];
}

// Utility to parse time strings like "16:00" or "4:00 PM" into hours
function calculateDurationHours(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 1.5; // Default session duration
  try {
    const parseTime = (tStr: string) => {
      const clean = tStr.trim().toUpperCase();
      let [timePart, modifier] = clean.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (isNaN(minutes)) minutes = 0;
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const diff = end - start;
    return diff > 0 ? Math.round(diff * 10) / 10 : 1.5;
  } catch {
    return 1.5;
  }
}

export const ClassClaimForm: React.FC<ClassClaimFormProps> = ({
  currentUser,
  currentRole = 'teacher',
  classList = [],
  sbaHubOptions = [],
  claims = [],
  onUpdateClaims,
  hourlyRates = [],
  onUpdateHourlyRates,
  users = [],
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'my-claims' | 'registrar-verification'>('calendar');
  
  // Current calendar view date state
  const [viewDate, setViewDate] = useState<Date>(new Date());
  
  // Selected teacher filter (for Admin / Registrar)
  const [selectedTeacherIdFilter, setSelectedTeacherIdFilter] = useState<string>('all');
  
  // Search and Date Range state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'verified' | 'rejected'>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'this-week' | 'this-month' | 'last-month' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Hourly Rate Edit State for Admin/Registrar
  const [editingRateUserId, setEditingRateUserId] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState<string>('40');

  // Rejection Notes Modal State
  const [rejectingClaim, setRejectingClaim] = useState<ClassClaimItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Get current user details
  const activeUserId = currentUser?.id || 'teacher-default';
  const activeUserName = currentUser?.name || 'Dr. Marcus Vance';
  const activeUserEmail = (currentUser as any)?.email || 'm.vance@shawstemacademy.edu';

  // Determine teacher profile for active claim view
  const resolvedTeacherId = (currentRole === 'admin' || currentRole === 'registrar') && selectedTeacherIdFilter !== 'all'
    ? selectedTeacherIdFilter
    : activeUserId;

  const resolvedTeacherUser = users.find((u) => u.id === resolvedTeacherId) || currentUser;
  const resolvedTeacherName = resolvedTeacherUser?.name || activeUserName;

  // Resolve Hourly Rate for Teacher
  const getTeacherHourlyRate = (tId: string): number => {
    const foundRate = hourlyRates.find((r) => r.userId === tId);
    return foundRate ? foundRate.hourlyRate : 40.0; // Default $40/hr
  };

  const currentTeacherRate = getTeacherHourlyRate(resolvedTeacherId);

  // Combine Regular Classes and SBA Hub Options into unified claimable schedule
  const allClaimableClasses = useMemo(() => {
    const regularItems = classList.map((c) => ({
      id: c.id,
      title: c.title,
      code: c.code,
      type: 'regular' as const,
      days: c.days || ['Monday', 'Wednesday'],
      startTime: c.startTime || '16:00',
      endTime: c.endTime || '17:30',
      instructor: c.instructor,
      isOffered: c.isOffered !== false,
    }));

    const sbaItems = sbaHubOptions.map((s) => ({
      id: s.id,
      title: s.title,
      code: s.code || 'SBA-HUB',
      type: 'sba_hub' as const,
      days: s.scheduleDays || ['Tuesday', 'Thursday'],
      startTime: s.startTime || '15:30',
      endTime: s.endTime || '17:00',
      instructor: s.instructor,
      isOffered: s.isOffered !== false,
    }));

    return [...regularItems, ...sbaItems];
  }, [classList, sbaHubOptions]);

  // Filter classes assigned to the resolved teacher
  const teacherScheduledClasses = useMemo(() => {
    if ((currentRole === 'admin' || currentRole === 'registrar') && selectedTeacherIdFilter === 'all') {
      return allClaimableClasses;
    }

    const assignedIds = (resolvedTeacherUser as any)?.assignedClassIds || [];
    return allClaimableClasses.filter((c) => {
      const matchInstructor = c.instructor && (
        c.instructor.toLowerCase().includes(resolvedTeacherName.toLowerCase()) ||
        resolvedTeacherName.toLowerCase().includes(c.instructor.toLowerCase())
      );
      const matchAssignedId = assignedIds.includes(c.id);
      return matchInstructor || matchAssignedId;
    });
  }, [allClaimableClasses, resolvedTeacherUser, resolvedTeacherName, currentRole, selectedTeacherIdFilter]);

  // Calendar Date calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthName = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Today's YYYY-MM-DD
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // First day of current month & total days
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Month days array
  const monthDays = useMemo(() => {
    const days: { dateStr: string; dayNum: number; dayOfWeekName: string; isFuture: boolean }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeekName = d.toLocaleString('en-US', { weekday: 'long' });
      
      // Determine if date is in the future
      const isFuture = dateStr > todayStr;

      days.push({
        dateStr,
        dayNum: day,
        dayOfWeekName,
        isFuture,
      });
    }
    return days;
  }, [year, month, daysInMonth, todayStr]);

  // Handle toggling claim for a class on a specific date
  const handleToggleClaim = (
    classObj: typeof allClaimableClasses[0],
    dateStr: string,
    dayOfWeekName: string,
    isFuture: boolean
  ) => {
    // CONSTRAINT: Cannot claim for a day that hasn't happened yet!
    if (isFuture) {
      alert(`Cannot claim for ${dateStr} because it is in the future. You can only claim classes for days that have already occurred.`);
      return;
    }

    const duration = calculateDurationHours(classObj.startTime, classObj.endTime);
    const rate = currentTeacherRate;
    const payout = Math.round(duration * rate * 100) / 100;

    const existingIndex = claims.findIndex(
      (c) => c.date === dateStr && c.classId === classObj.id && c.teacherId === resolvedTeacherId
    );

    if (existingIndex >= 0) {
      const existing = claims[existingIndex];
      if (existing.status === 'verified') {
        alert('This claim has already been verified and approved by the Registrar. It cannot be unchecked.');
        return;
      }
      // Uncheck / Remove claim
      const updated = claims.filter((_, idx) => idx !== existingIndex);
      onUpdateClaims(updated);
    } else {
      // Create new claim item
      const newClaim: ClassClaimItem = {
        id: `claim-${classObj.id}-${dateStr}-${Date.now().toString().slice(-4)}`,
        classId: classObj.id,
        className: classObj.title,
        classCode: classObj.code,
        classType: classObj.type,
        teacherId: resolvedTeacherId,
        teacherName: resolvedTeacherName,
        teacherEmail: (resolvedTeacherUser as any)?.email,
        date: dateStr,
        dayOfWeek: dayOfWeekName,
        startTime: classObj.startTime,
        endTime: classObj.endTime,
        durationHours: duration,
        hourlyRate: rate,
        calculatedPayout: payout,
        status: 'claimed',
        claimedAt: new Date().toISOString(),
      };
      onUpdateClaims([newClaim, ...claims]);
    }
  };

  // Registrar / Admin Status Actions
  const handleVerifyClaim = (claimId: string) => {
    const updated = claims.map((c) =>
      c.id === claimId
        ? {
            ...c,
            status: 'verified' as const,
            verifiedAt: new Date().toISOString(),
            verifiedBy: activeUserName,
          }
        : c
    );
    onUpdateClaims(updated);
  };

  const handleOpenRejectModal = (claim: ClassClaimItem) => {
    setRejectingClaim(claim);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingClaim) return;
    const updated = claims.map((c) =>
      c.id === rejectingClaim.id
        ? {
            ...c,
            status: 'rejected' as const,
            rejectionNotes: rejectionReason.trim() || 'Claim rejected by Registrar during payroll verification.',
            verifiedAt: new Date().toISOString(),
            verifiedBy: activeUserName,
          }
        : c
    );
    onUpdateClaims(updated);
    setRejectingClaim(null);
  };

  const handleVerifyAllPending = () => {
    const pendingCount = claims.filter((c) => c.status === 'claimed').length;
    if (pendingCount === 0) {
      alert('No pending claims to verify.');
      return;
    }

    if (confirm(`Are you sure you want to verify and approve all ${pendingCount} pending claim(s)?`)) {
      const updated = claims.map((c) =>
        c.status === 'claimed'
          ? {
              ...c,
              status: 'verified' as const,
              verifiedAt: new Date().toISOString(),
              verifiedBy: activeUserName,
            }
          : c
      );
      onUpdateClaims(updated);
    }
  };

  // Save Hourly Rate
  const handleSaveHourlyRate = (userId: string, userName: string) => {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid positive hourly rate (e.g. 45.00).');
      return;
    }

    const updatedRates = [...(hourlyRates || [])];
    const idx = updatedRates.findIndex((r) => r.userId === userId);
    if (idx >= 0) {
      updatedRates[idx] = { userId, userName, hourlyRate: val };
    } else {
      updatedRates.push({ userId, userName, hourlyRate: val });
    }

    if (onUpdateHourlyRates) {
      onUpdateHourlyRates(updatedRates);
    }
    setEditingRateUserId(null);
  };

  // Date Filter helper calculation
  const getDateRangeBounds = useMemo(() => {
    const curr = new Date();
    if (dateRangePreset === 'this-week') {
      const first = curr.getDate() - curr.getDay(); // Sunday
      const last = first + 6; // Saturday
      const start = new Date(curr.setDate(first)).toISOString().split('T')[0];
      const end = new Date(curr.setDate(last)).toISOString().split('T')[0];
      return { start, end };
    }
    if (dateRangePreset === 'this-month') {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const start = `${y}-${m}-01`;
      const lastDay = new Date(y, curr.getMonth() + 1, 0).getDate();
      const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    }
    if (dateRangePreset === 'last-month') {
      const lastMDate = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      const y = lastMDate.getFullYear();
      const m = String(lastMDate.getMonth() + 1).padStart(2, '0');
      const start = `${y}-${m}-01`;
      const lastDay = new Date(y, lastMDate.getMonth() + 1, 0).getDate();
      const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      return { start, end };
    }
    if (dateRangePreset === 'custom') {
      return { start: customStartDate || '2000-01-01', end: customEndDate || '2099-12-31' };
    }
    return { start: '2000-01-01', end: '2099-12-31' };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Filtered claims for list views
  const filteredClaims = useMemo(() => {
    const { start, end } = getDateRangeBounds;

    return claims.filter((c) => {
      const matchesSearch =
        c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.date.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      const matchesTeacher =
        (currentRole !== 'admin' && currentRole !== 'registrar') ||
        selectedTeacherIdFilter === 'all' ||
        c.teacherId === selectedTeacherIdFilter;

      const matchesDateRange = c.date >= start && c.date <= end;

      return matchesSearch && matchesStatus && matchesTeacher && matchesDateRange;
    });
  }, [claims, searchQuery, statusFilter, selectedTeacherIdFilter, currentRole, getDateRangeBounds]);

  // Aggregated Summary View by Teacher for Admin/Registrar
  const monthlyTeacherSummary = useMemo(() => {
    // Collect all teachers (from users list or claims list)
    const staffUsers = users.filter((u) => u.role !== 'student');
    const teacherMap = new Map<string, {
      id: string;
      name: string;
      role: string;
      hourlyRate: number;
      totalClaimsCount: number;
      totalHours: number;
      pendingPayout: number;
      verifiedPayout: number;
      totalPayout: number;
    }>();

    // Initialize map for all staff
    staffUsers.forEach((u) => {
      const rate = getTeacherHourlyRate(u.id);
      teacherMap.set(u.id, {
        id: u.id,
        name: u.name,
        role: u.role,
        hourlyRate: rate,
        totalClaimsCount: 0,
        totalHours: 0,
        pendingPayout: 0,
        verifiedPayout: 0,
        totalPayout: 0,
      });
    });

    // Process all filtered claims (or claims within selected date range)
    filteredClaims.forEach((c) => {
      let teacherObj = teacherMap.get(c.teacherId);
      if (!teacherObj) {
        teacherObj = {
          id: c.teacherId,
          name: c.teacherName,
          role: 'teacher',
          hourlyRate: c.hourlyRate || 40,
          totalClaimsCount: 0,
          totalHours: 0,
          pendingPayout: 0,
          verifiedPayout: 0,
          totalPayout: 0,
        };
        teacherMap.set(c.teacherId, teacherObj);
      }

      teacherObj.totalClaimsCount += 1;
      teacherObj.totalHours += c.durationHours;
      teacherObj.totalPayout += c.calculatedPayout;
      if (c.status === 'verified') {
        teacherObj.verifiedPayout += c.calculatedPayout;
      } else if (c.status === 'claimed') {
        teacherObj.pendingPayout += c.calculatedPayout;
      }
    });

    return Array.from(teacherMap.values()).filter((t) => t.totalClaimsCount > 0 || staffUsers.some((u) => u.id === t.id));
  }, [users, filteredClaims, hourlyRates]);

  // PDF Report Generator for Faculty Payroll Summary
  const handleDownloadPdfReport = () => {
    const reportPeriod = dateRangePreset.replace('-', ' ').toUpperCase();
    const currentDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let grandTotalHours = 0;
    let grandTotalPayout = 0;
    monthlyTeacherSummary.forEach(t => {
      grandTotalHours += t.totalHours;
      grandTotalPayout += t.totalPayout;
    });

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SHAW STEM ACADEMY - FACULTY PAYROLL & CLAIMS REPORT</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; padding: 0; background: #fff; }
            .header { border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .subtitle { font-size: 13px; font-weight: 600; color: #2563eb; margin-top: 4px; }
            .meta { font-size: 11px; text-align: right; color: #64748b; line-height: 1.5; }
            .period-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .period-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; }
            .period-value { font-size: 14px; font-weight: 800; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }
            td { font-size: 11px; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .payout-col { font-weight: 800; color: #047857; text-align: right; }
            .totals-row { background: #f1f5f9 !important; font-weight: 800; }
            .totals-row td { font-size: 12px; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
            .footer { margin-top: 50px; pt: 20px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
            .signature-line { margin-top: 40px; border-top: 1px solid #94a3b8; width: 200px; text-align: center; font-size: 11px; font-weight: 700; color: #334155; padding-top: 5px; }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <h1 class="title">Shaw STEM Academy</h1>
              <div class="subtitle">Official Faculty Payroll & Class Teaching Claims Statement</div>
            </div>
            <div class="meta">
              <div><strong>Report ID:</strong> SSA-PAY-${Date.now().toString().slice(-6)}</div>
              <div><strong>Generated Date:</strong> ${currentDateStr}</div>
              <div><strong>Issuer:</strong> Office of the Registrar</div>
            </div>
          </div>

          <div class="period-box">
            <div>
              <div class="period-title">Report Period Filter</div>
              <div class="period-value">${reportPeriod}</div>
            </div>
            <div style="text-align: right;">
              <div class="period-title">Faculty Count Included</div>
              <div class="period-value">${monthlyTeacherSummary.length} Teachers</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th>Role</th>
                <th>Classes Claimed</th>
                <th>Total Hours</th>
                <th>Hourly Rate</th>
                <th>Pending Payout</th>
                <th>Verified Payout</th>
                <th style="text-align: right;">Total Calculated Payout</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyTeacherSummary.map(t => `
                <tr>
                  <td><strong>${t.name}</strong></td>
                  <td style="text-transform: uppercase;">${t.role}</td>
                  <td>${t.totalClaimsCount} classes</td>
                  <td>${t.totalHours.toFixed(1)} hrs</td>
                  <td>$${t.hourlyRate.toFixed(2)}/hr</td>
                  <td>$${t.pendingPayout.toFixed(2)}</td>
                  <td style="color: #047857; font-weight: 700;">$${t.verifiedPayout.toFixed(2)}</td>
                  <td class="payout-col">$${t.totalPayout.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="totals-row">
                <td colspan="3"><strong>GRAND TOTALS</strong></td>
                <td><strong>${grandTotalHours.toFixed(1)} hrs</strong></td>
                <td>—</td>
                <td>—</td>
                <td>—</td>
                <td class="payout-col" style="font-size: 14px;">$${grandTotalPayout.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #334155;">Verification Authorization:</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">This document certifies teaching hours logged via the Shaw STEM Academy Portal.</div>
            </div>
            <div class="signature-line">
              Registrar Signature / Date
            </div>
          </div>

          <div class="footer">
            <div>Shaw STEM Academy • 100 Academy Boulevard, STEM Campus</div>
            <div>Page 1 of 1 • Confidential Payroll Audit Record</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    }
  };

  // Calculate Unclaimed Scheduled Classes from the Previous Week for Notification
  const unclaimedPreviousWeekClasses = useMemo(() => {
    if (!resolvedTeacherId) return [];

    const todayDate = new Date();
    const unclaimed: { dateStr: string; dayOfWeekName: string; classObj: typeof allClaimableClasses[0] }[] = [];

    // Check last 7 days (excluding today)
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date();
      pastDate.setDate(todayDate.getDate() - i);

      const dateStr = pastDate.toISOString().split('T')[0];
      const dayOfWeekName = pastDate.toLocaleString('en-US', { weekday: 'long' });

      teacherScheduledClasses.forEach((cls) => {
        // Check if class occurs on this day of week
        if (cls.days.includes(dayOfWeekName)) {
          // Check if claim exists
          const exists = claims.some(
            (c) => c.date === dateStr && c.classId === cls.id && c.teacherId === resolvedTeacherId
          );
          if (!exists) {
            unclaimed.push({
              dateStr,
              dayOfWeekName,
              classObj: cls,
            });
          }
        }
      });
    }

    return unclaimed;
  }, [teacherScheduledClasses, claims, resolvedTeacherId, allClaimableClasses]);

  // Handler to Quick-Claim all past week unclaimed classes
  const handleBatchClaimPreviousWeek = () => {
    if (unclaimedPreviousWeekClasses.length === 0) return;

    const newClaims: ClassClaimItem[] = [...claims];
    let addedCount = 0;

    unclaimedPreviousWeekClasses.forEach(({ dateStr, dayOfWeekName, classObj }) => {
      const duration = calculateDurationHours(classObj.startTime, classObj.endTime);
      const rate = currentTeacherRate;
      const payout = Math.round(duration * rate * 100) / 100;

      newClaims.push({
        id: `claim-${classObj.id}-${dateStr}-${Date.now().toString().slice(-4)}-batch`,
        classId: classObj.id,
        className: classObj.title,
        classCode: classObj.code,
        classType: classObj.type,
        teacherId: resolvedTeacherId,
        teacherName: resolvedTeacherName,
        teacherEmail: (resolvedTeacherUser as any)?.email,
        date: dateStr,
        dayOfWeek: dayOfWeekName,
        startTime: classObj.startTime,
        endTime: classObj.endTime,
        durationHours: duration,
        hourlyRate: rate,
        calculatedPayout: payout,
        status: 'claimed',
        claimedAt: new Date().toISOString(),
      });
      addedCount++;
    });

    onUpdateClaims(newClaims);
    alert(`Successfully auto-claimed ${addedCount} scheduled classes from last week! They are now pending Registrar verification.`);
  };

  // State for Registrar Verification View Sub-Mode ('active' vs 'archived')
  const [registrarQueueMode, setRegistrarQueueMode] = useState<'active' | 'archived'>('active');

  // Filtered Claims split into Active Queue vs Archived Audit History
  const activeClaimsQueue = useMemo(() => {
    return filteredClaims.filter((c) => c.status === 'claimed');
  }, [filteredClaims]);

  const archivedClaimsAuditTrail = useMemo(() => {
    return filteredClaims.filter((c) => c.status === 'verified' || c.status === 'rejected');
  }, [filteredClaims]);

  // Summary Metrics
  const myClaimsList = claims.filter((c) => c.teacherId === resolvedTeacherId);
  const totalMyHours = myClaimsList.reduce((acc, curr) => acc + curr.durationHours, 0);
  const totalMyPayout = myClaimsList.reduce((acc, curr) => acc + curr.calculatedPayout, 0);
  const totalMyVerifiedPayout = myClaimsList
    .filter((c) => c.status === 'verified')
    .reduce((acc, curr) => acc + curr.calculatedPayout, 0);

  const totalAllClaims = claims.length;
  const totalAllPending = claims.filter((c) => c.status === 'claimed').length;
  const totalAllVerifiedPayout = claims
    .filter((c) => c.status === 'verified')
    .reduce((acc, curr) => acc + curr.calculatedPayout, 0);

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Navigation */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>SBA Hub & Course Bank Claims Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty Teaching Claim Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mark classes taught from your scheduled Course Bank and SBA Hub options. Claims are logged on a calendar view and verified by the Registrar for payroll calculation.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Hourly Rate</span>
              <div className="text-lg font-black text-emerald-400">${currentTeacherRate.toFixed(2)}/hr</div>
            </div>
            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Claimed Hours</span>
              <div className="text-lg font-black text-blue-400">{totalMyHours.toFixed(1)} hrs</div>
            </div>
            <div className="p-3.5 col-span-2 sm:col-span-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Payout</span>
              <div className="text-lg font-black text-amber-400">${totalMyPayout.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Teaching Calendar Claim</span>
            </button>

            <button
              onClick={() => setActiveTab('my-claims')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                activeTab === 'my-claims'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Submitted Claims ({myClaimsList.length})</span>
            </button>

            {(currentRole === 'registrar' || currentRole === 'admin') && (
              <button
                onClick={() => setActiveTab('registrar-verification')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeTab === 'registrar-verification'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-teal-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-teal-300" />
                <span>Registrar Payroll Verification</span>
                {totalAllPending > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                    {totalAllPending} Pending
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Teacher Dropdown Filter for Admins / Registrars */}
          {(currentRole === 'admin' || currentRole === 'registrar') && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-300 font-bold">Faculty View:</span>
              <select
                value={selectedTeacherIdFilter}
                onChange={(e) => setSelectedTeacherIdFilter(e.target.value)}
                className="bg-slate-900 text-white border border-slate-700 rounded-lg text-xs font-bold px-2.5 py-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Faculty & CourseBank</option>
                {users.filter((u) => u.role !== 'student').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Unclaimed Classes Automated Notification Banner for Teachers */}
      {unclaimedPreviousWeekClasses.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                <span>Unclaimed Classes Alert from Previous Week</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                  {unclaimedPreviousWeekClasses.length} Scheduled
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed max-w-2xl font-medium">
                You have <strong>{unclaimedPreviousWeekClasses.length} scheduled classes</strong> from last week that haven't been claimed yet. Log them now to ensure timely inclusion in the current payroll period.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBatchClaimPreviousWeek}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Quick-Claim All Last Week ({unclaimedPreviousWeekClasses.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: CALENDAR CLAIM VIEW */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span>{monthName} Class Schedule</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Click the checkmark next to scheduled classes on past/today's dates to log your teaching claim.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800">{monthName}</span>
                <button
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="p-2 hover:bg-white rounded-xl text-slate-700 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setViewDate(new Date())}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
              >
                Today
              </button>
            </div>
          </div>

          {/* Date Rule Banner */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Claiming Rule Enforcement:</span> Classes can only be marked as taught for days that have already occurred up to today ({todayStr}). Future calendar days are disabled until those classes take place.
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-2 border-b border-slate-100">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {/* Blank offset cells for starting day of month */}
            {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="min-h-[120px] bg-slate-50/40 rounded-2xl border border-dashed border-slate-100" />
            ))}

            {/* Days of the month */}
            {monthDays.map((d) => {
              const isTodayCell = d.dateStr === todayStr;

              // Find classes scheduled on this day of week
              const classesForDay = teacherScheduledClasses.filter((c) => {
                if (!c.days) return false;
                if (Array.isArray(c.days)) {
                  return c.days.some((dayName) =>
                    d.dayOfWeekName.toLowerCase().includes(dayName.toLowerCase()) ||
                    dayName.toLowerCase().includes(d.dayOfWeekName.toLowerCase())
                  );
                }
                return (c.days as string).toLowerCase().includes(d.dayOfWeekName.toLowerCase());
              });

              return (
                <div
                  key={d.dateStr}
                  className={`min-h-[130px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                    isTodayCell
                      ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-400/40 shadow-xs'
                      : d.isFuture
                      ? 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Top Cell Header: Date number & Future/Today Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isTodayCell
                          ? 'bg-blue-600 text-white'
                          : d.isFuture
                          ? 'text-slate-400 bg-slate-200/60'
                          : 'text-slate-800 bg-slate-100'
                      }`}
                    >
                      {d.dayNum}
                    </span>

                    {d.isFuture ? (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Future</span>
                      </span>
                    ) : isTodayCell ? (
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    ) : null}
                  </div>

                  {/* Class Occurrences on this day */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px]">
                    {classesForDay.length === 0 ? (
                      <div className="text-[10px] text-slate-300 italic pt-2 text-center">
                        No classes
                      </div>
                    ) : (
                      classesForDay.map((cls) => {
                        const existingClaim = claims.find(
                          (c) => c.date === d.dateStr && c.classId === cls.id && c.teacherId === resolvedTeacherId
                        );

                        const isClaimed = !!existingClaim;
                        const isVerified = existingClaim?.status === 'verified';
                        const isRejected = existingClaim?.status === 'rejected';

                        const sessionHours = calculateDurationHours(cls.startTime, cls.endTime);
                        const sessionPayout = Math.round(sessionHours * currentTeacherRate * 100) / 100;

                        return (
                          <div
                            key={`${cls.id}-${d.dateStr}`}
                            className={`p-2 rounded-xl text-[11px] border transition-all flex flex-col justify-between space-y-1.5 ${
                              isVerified
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                                : isRejected
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : isClaimed
                                ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-2xs font-semibold'
                                : d.isFuture
                                ? 'bg-slate-100/80 border-slate-200 text-slate-500'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <div className="font-extrabold truncate text-[11px] leading-tight">
                                  {cls.title}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>{cls.startTime} - {cls.endTime}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-purple-700">{sessionHours}h</span>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ${
                                  cls.type === 'sba_hub'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {cls.type === 'sba_hub' ? 'SBA' : 'Class'}
                              </span>
                            </div>

                            {/* Checkmark Button / Claim Action */}
                            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="font-extrabold text-[10px] text-emerald-700">
                                ${sessionPayout.toFixed(2)}
                              </span>

                              <button
                                onClick={() => handleToggleClaim(cls, d.dateStr, d.dayOfWeekName, d.isFuture)}
                                disabled={d.isFuture}
                                title={
                                  d.isFuture
                                    ? 'Cannot claim future classes'
                                    : isVerified
                                    ? 'Verified by Registrar'
                                    : isClaimed
                                    ? 'Click to remove claim'
                                    : 'Click to mark as taught and claim payout'
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                                  d.isFuture
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : isVerified
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : isRejected
                                    ? 'bg-rose-600 text-white'
                                    : isClaimed
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                    : 'bg-white hover:bg-emerald-600 hover:text-white border border-slate-300 text-slate-700 shadow-2xs'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Verified</span>
                                  </>
                                ) : isRejected ? (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    <span>Rejected</span>
                                  </>
                                ) : isClaimed ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                    <span>Claimed</span>
                                  </>
                                ) : d.isFuture ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Locked</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Claim</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MY SUBMITTED CLAIMS LIST */}
      {activeTab === 'my-claims' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Submitted Claims Log ({resolvedTeacherName})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Detailed history of all teaching claims submitted for verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
                <select
                  value={dateRangePreset}
                  onChange={(e) => setDateRangePreset(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold text-xs px-2 py-1 focus:outline-hidden cursor-pointer"
                >
                  <option value="this-month">This Month</option>
                  <option value="this-week">This Week</option>
                  <option value="last-month">Last Month</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {dateRangePreset === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              )}

              <input
                type="text"
                placeholder="Search by class title or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs w-60 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Total Claimed Hours</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalMyHours.toFixed(1)} hrs</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-bold text-amber-800">Pending Verification Payout</div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                ${(totalMyPayout - totalMyVerifiedPayout).toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800">Verified & Approved Payout</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">${totalMyVerifiedPayout.toFixed(2)}</div>
            </div>
          </div>

          {/* Table of Claims */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Class / Course</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Date & Day</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4">Hourly Rate</th>
                  <th className="py-3.5 px-4">Payout</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {myClaimsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No claims logged yet. Use the Teaching Calendar tab to mark past classes as taught.
                    </td>
                  </tr>
                ) : (
                  myClaimsList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.className}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.classType === 'sba_hub' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.classType === 'sba_hub' ? 'SBA Hub' : 'Regular'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {c.date} ({c.dayOfWeek})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">{c.durationHours} hrs</td>
                      <td className="py-3.5 px-4 text-slate-600">${c.hourlyRate.toFixed(2)}/hr</td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700">${c.calculatedPayout.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        {c.status === 'verified' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        ) : c.status === 'rejected' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Verification
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTRAR PAYROLL VERIFICATION (Registrar & Admin Only) */}
      {activeTab === 'registrar-verification' && (currentRole === 'registrar' || currentRole === 'admin') && (
        <div className="bg-white rounded-3xl border border-teal-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Registrar Verification & Audit Portal</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Faculty Payroll Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review submitted claims, set faculty hourly rates, and approve payout claims for disbursements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleVerifyAllPending}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify All Pending ({totalAllPending})</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Print Payroll Summary</span>
              </button>
            </div>
          </div>

          {/* Monthly Aggregated Payroll Summary View by Teacher */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2 text-white">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Monthly Aggregated Faculty Payroll Summary</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Aggregated claims, hours, and calculated payouts per teacher for the current period filter.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-300">
                  Period Filter: <span className="text-amber-400 uppercase font-black">{dateRangePreset.replace('-', ' ')}</span>
                </div>

                <button
                  onClick={handleDownloadPdfReport}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-3">Faculty Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Classes Claimed</th>
                    <th className="py-2.5 px-3">Total Hours</th>
                    <th className="py-2.5 px-3">Hourly Rate</th>
                    <th className="py-2.5 px-3">Pending Payout</th>
                    <th className="py-2.5 px-3">Verified Payout</th>
                    <th className="py-2.5 px-3 font-black text-amber-300">Total Calculated Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {monthlyTeacherSummary.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                        No faculty claim activity recorded for this period filter.
                      </td>
                    </tr>
                  ) : (
                    monthlyTeacherSummary.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{t.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {t.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-300">{t.totalClaimsCount} classes</td>
                        <td className="py-3 px-3 font-bold text-purple-300">{t.totalHours.toFixed(1)} hrs</td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">${t.hourlyRate.toFixed(2)}/hr</td>
                        <td className="py-3 px-3 text-amber-300 font-bold">${t.pendingPayout.toFixed(2)}</td>
                        <td className="py-3 px-3 text-emerald-300 font-bold">${t.verifiedPayout.toFixed(2)}</td>
                        <td className="py-3 px-3 text-amber-400 font-black text-sm">${t.totalPayout.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Faculty Hourly Rate Configuration</span>
              </h3>
              <span className="text-xs text-slate-500">Default rate: $40.00/hr</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.filter((u) => u.role !== 'student').map((u) => {
                const currentRate = getTeacherHourlyRate(u.id);
                const isEditing = editingRateUserId === u.id;

                return (
                  <div key={u.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{u.role}</div>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-bold text-slate-500">$</span>
                        <input
                          type="number"
                          value={rateInput}
                          onChange={(e) => setRateInput(e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                        />
                        <button
                          onClick={() => handleSaveHourlyRate(u.id, u.name)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-xs text-emerald-700">${currentRate.toFixed(2)}/hr</span>
                        <button
                          onClick={() => {
                            setEditingRateUserId(u.id);
                            setRateInput(currentRate.toString());
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                          title="Edit Rate"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registrar Claims Verification List with Active vs Archived Audit Sub-Modes */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              {/* Queue Mode Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setRegistrarQueueMode('active')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                    registrarQueueMode === 'active'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Queue ({activeClaimsQueue.length})</span>
                </button>

                <button
                  onClick={() => setRegistrarQueueMode('archived')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                    registrarQueueMode === 'archived'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Archived Claims & Audit Trail ({archivedClaimsAuditTrail.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Statuses ({totalAllClaims})</option>
                    <option value="claimed">Pending Verification ({totalAllPending})</option>
                    <option value="verified">Verified & Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="text-xs font-bold text-slate-600">
                  Verified Payout: <span className="text-emerald-700 text-sm font-black">${totalAllVerifiedPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Faculty Member</th>
                    <th className="py-3.5 px-4">Class Title</th>
                    <th className="py-3.5 px-4">Date & Session</th>
                    <th className="py-3.5 px-4">Hours</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Payout</th>
                    <th className="py-3.5 px-4">Status & Audit</th>
                    <th className="py-3.5 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {(registrarQueueMode === 'active' ? activeClaimsQueue : archivedClaimsAuditTrail).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No {registrarQueueMode === 'active' ? 'pending' : 'archived'} claims recorded in this view for current filters.
                      </td>
                    </tr>
                  ) : (
                    (registrarQueueMode === 'active' ? activeClaimsQueue : archivedClaimsAuditTrail).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.teacherName}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{c.className}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{c.classType}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {c.date} ({c.dayOfWeek})
                        </td>
                        <td className="py-3.5 px-4 font-bold text-purple-700">{c.durationHours} hrs</td>
                        <td className="py-3.5 px-4 text-slate-600">${c.hourlyRate.toFixed(2)}/hr</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">${c.calculatedPayout.toFixed(2)}</td>
                        <td className="py-3.5 px-4">
                          {c.status === 'verified' ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xs">
                                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                Verified & Settled
                              </span>
                              {c.verifiedBy && (
                                <div className="text-[9px] text-slate-500 font-semibold italic">
                                  Approved by {c.verifiedBy}
                                </div>
                              )}
                            </div>
                          ) : c.status === 'rejected' ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[10px] inline-flex items-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xs">
                                <XCircle className="w-3 h-3 text-rose-700" />
                                Rejected
                              </span>
                              {c.rejectionReason && (
                                <div className="text-[9px] text-rose-700 font-medium truncate max-w-xs" title={c.rejectionReason}>
                                  Reason: {c.rejectionReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-xs">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              Pending Verification
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.status !== 'verified' && (
                              <button
                                onClick={() => handleVerifyClaim(c.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all duration-200 flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify</span>
                              </button>
                            )}

                            {c.status !== 'rejected' && (
                              <button
                                onClick={() => handleOpenRejectModal(c)}
                                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] rounded-lg transition-all duration-200 flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notes Modal */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Teaching Claim</span>
              </h3>
              <button
                onClick={() => setRejectingClaim(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please state the reason for rejecting <strong>{rejectingClaim.teacherName}</strong>'s claim for <strong>{rejectingClaim.className}</strong> on {rejectingClaim.date}.
            </p>

            <textarea
              rows={3}
              placeholder="e.g., Class was canceled on this date due to holiday."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingClaim(null)}
                className="px-4 py-2 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
