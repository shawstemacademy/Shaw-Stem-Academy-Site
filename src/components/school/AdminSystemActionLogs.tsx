import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  UserCheck,
  Users,
  Settings2,
  Ban,
  Key,
  Tag,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  Shield,
  Copy,
  Check,
  X,
  User,
  Monitor,
  Calendar,
  Layers,
  Terminal,
  RotateCcw,
  UserX,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Hash,
  Sparkles
} from 'lucide-react';
import { SystemActionLog } from '../../types';

interface AdminSystemActionLogsProps {
  logs: SystemActionLog[];
  onClearLogs?: () => void;
  initialActionType?: string;
  titleOverride?: string;
}

export const AdminSystemActionLogs: React.FC<AdminSystemActionLogsProps> = ({
  logs = [],
  initialActionType = 'all',
  titleOverride,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userIdFilter, setUserIdFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>(initialActionType);
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'today' | '24h' | '7d' | '30d'>('all');
  const [showMetadataToggle, setShowMetadataToggle] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique user options with User IDs, Emails, Roles, and action counts
  const uniqueUserOptions = useMemo(() => {
    const map = new Map<string, { userId?: string; name: string; email?: string; role?: string; count: number }>();

    logs.forEach((log) => {
      const key = log.actorUserId || log.actorEmail || log.actor || 'unknown_actor';
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          userId: log.actorUserId,
          name: log.actor || 'Unknown Actor',
          email: log.actorEmail,
          role: log.actorRole,
          count: 1,
        });
      }
    });

    return Array.from(map.entries()).map(([key, val], idx) => ({
      key: key || `user-option-${idx}`,
      ...val,
    }));
  }, [logs]);

  // Extract unique action types present in logs
  const actionTypes = [
    { value: 'all', label: 'All Action Types' },
    { value: 'app_error', label: '⚠️ Application Errors' },
    { value: 'registration', label: 'Registration' },
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'user_disabled', label: 'User Disabled' },
    { value: 'user_enabled', label: 'User Enabled' },
    { value: 'user_deleted', label: 'User Deleted' },
    { value: 'role_changed', label: 'Role Changed' },
    { value: 'discount_updated', label: 'Discount Updated' },
    { value: 'login', label: 'User Login / Auth' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'other', label: 'Other Actions' },
  ];

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get Badge Icon and Style per Action Type
  const getActionBadge = (type: SystemActionLog['actionType']) => {
    switch (type) {
      case 'app_error':
        return {
          icon: Shield,
          label: 'Application Error',
          color: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
        };
      case 'registration':
        return {
          icon: UserCheck,
          label: 'Registration',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'user_created':
        return {
          icon: Users,
          label: 'User Created',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'user_updated':
        return {
          icon: Settings2,
          label: 'User Updated',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'user_disabled':
        return {
          icon: Ban,
          label: 'User Disabled',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'user_enabled':
        return {
          icon: RotateCcw,
          label: 'User Enabled',
          color: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'user_deleted':
        return {
          icon: UserX,
          label: 'User Deleted',
          color: 'bg-red-100 text-red-800 border-red-300 font-extrabold',
        };
      case 'role_changed':
        return {
          icon: Key,
          label: 'Role Changed',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'discount_updated':
        return {
          icon: Tag,
          label: 'Discount Updated',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'login':
        return {
          icon: Shield,
          label: 'User Login',
          color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
      case 'system_alert':
        return {
          icon: Activity,
          label: 'System Alert',
          color: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      default:
        return {
          icon: Activity,
          label: type ? type.replace('_', ' ') : 'Action',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  // Filter logs based on search, User ID, action type, and time range
  const filteredLogs = useMemo(() => {
    const now = Date.now();

    return logs.filter((log) => {
      // 1. User ID / Actor Filter
      if (userIdFilter !== 'all') {
        const matchesUserId = log.actorUserId && log.actorUserId.toLowerCase() === userIdFilter.toLowerCase();
        const matchesEmail = log.actorEmail && log.actorEmail.toLowerCase() === userIdFilter.toLowerCase();
        const matchesActor = log.actor && log.actor.toLowerCase() === userIdFilter.toLowerCase();
        const matchesKey = (log.actorUserId || log.actorEmail || log.actor) === userIdFilter;

        if (!matchesUserId && !matchesEmail && !matchesActor && !matchesKey) {
          return false;
        }
      }

      // 2. Action Type Filter
      if (selectedTypeFilter !== 'all' && log.actionType !== selectedTypeFilter) {
        return false;
      }

      // 3. Time Range Filter
      if (timeRangeFilter !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const diffHours = (now - logTime) / (1000 * 60 * 60);

        if (timeRangeFilter === 'today') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (logTime < todayStart.getTime()) return false;
        } else if (timeRangeFilter === '24h' && diffHours > 24) {
          return false;
        } else if (timeRangeFilter === '7d' && diffHours > 24 * 7) {
          return false;
        } else if (timeRangeFilter === '30d' && diffHours > 24 * 30) {
          return false;
        }
      }

      // 4. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = log.description.toLowerCase().includes(q);
        const matchActor = log.actor.toLowerCase().includes(q);
        const matchUserId = (log.actorUserId || '').toLowerCase().includes(q);
        const matchEmail = (log.actorEmail || '').toLowerCase().includes(q);
        const matchIp = (log.ipAddress || '').toLowerCase().includes(q);
        const matchBrowser = (log.browser || '').toLowerCase().includes(q);
        const matchOS = (log.os || '').toLowerCase().includes(q);
        const matchType = log.actionType.toLowerCase().includes(q);
        const matchMetadata = log.metadata
          ? JSON.stringify(log.metadata).toLowerCase().includes(q)
          : false;

        return (
          matchDesc ||
          matchActor ||
          matchUserId ||
          matchEmail ||
          matchIp ||
          matchBrowser ||
          matchOS ||
          matchType ||
          matchMetadata
        );
      }

      return true;
    });
  }, [logs, userIdFilter, selectedTypeFilter, timeRangeFilter, searchQuery]);

  // Metric 1: Total Actions in currently filtered period
  const totalFilteredActions = filteredLogs.length;

  // Metric 2: Unique Active Users in currently filtered period
  const uniqueFilteredUsersCount = useMemo(() => {
    const userSet = new Set<string>();
    filteredLogs.forEach((log) => {
      const identifier = log.actorUserId || log.actorEmail || log.actor;
      if (identifier) userSet.add(identifier);
    });
    return userSet.size;
  }, [filteredLogs]);

  // Metric 3: Most Frequent Action in currently filtered period
  const mostFrequentActionInfo = useMemo(() => {
    if (filteredLogs.length === 0) {
      return { label: 'None', count: 0, percentage: 0, type: 'none' };
    }
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      const type = log.actionType || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });

    let topType = 'other';
    let maxCount = 0;
    Object.entries(counts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topType = type;
      }
    });

    const badge = getActionBadge(topType as any);
    const percentage = Math.round((maxCount / filteredLogs.length) * 100);

    return {
      type: topType,
      label: badge.label,
      count: maxCount,
      percentage,
    };
  }, [filteredLogs]);

  // Export filtered logs to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system_activity_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export filtered logs to CSV
  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Action Type',
      'Description',
      'Actor',
      'Actor User ID',
      'Actor Email',
      'Actor Role',
      'IP Address',
      'Browser',
      'OS',
      'Device Type',
      'Screen Resolution',
      'Viewport',
      'Timezone',
      'Path',
      'Metadata JSON',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.actionType}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${(log.actor || '').replace(/"/g, '""')}"`,
      `"${(log.actorUserId || '').replace(/"/g, '""')}"`,
      `"${(log.actorEmail || '').replace(/"/g, '""')}"`,
      `"${(log.actorRole || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress || ''}"`,
      `"${(log.browser || '').replace(/"/g, '""')}"`,
      `"${(log.os || '').replace(/"/g, '""')}"`,
      `"${log.deviceType || ''}"`,
      `"${log.screenResolution || ''}"`,
      `"${log.viewportSize || ''}"`,
      `"${log.timeZone || ''}"`,
      `"${log.path || ''}"`,
      `"${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_activity_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
      case 'Tablet':
        return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Laptop className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setUserIdFilter('all');
    setSelectedTypeFilter('all');
    setTimeRangeFilter('all');
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    userIdFilter !== 'all' ||
    selectedTypeFilter !== 'all' ||
    timeRangeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            {titleOverride || 'System Activity & Security Analysis'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail capturing user actions, granular browser/OS diagnostics, IP addresses, and payload metadata in real-time.
          </p>
        </div>

        {/* Quick Action Controls & Metadata Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMetadataToggle(!showMetadataToggle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-2xs ${
              showMetadataToggle
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
            title="Toggle showing detailed metadata (IP, OS, browser) inline in table rows"
          >
            {showMetadataToggle ? (
              <>
                <Eye className="w-3.5 h-3.5 text-white" />
                <span>Detailed Metadata: ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Show Detailed Metadata</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export currently filtered logs as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={filteredLogs.length === 0}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export currently filtered logs as raw JSON"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Currently Filtered Period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Actions */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-3xl border border-blue-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-wider">
              Total Actions
            </span>
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalFilteredActions}</div>
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
            <span>In currently filtered period</span>
            {logs.length > 0 && (
              <span className="text-slate-400 font-normal">
                ({Math.round((totalFilteredActions / logs.length) * 100)}% of total history)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Unique Active Users */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 p-5 rounded-3xl border border-purple-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-purple-900/60 uppercase tracking-wider">
              Unique Active Users
            </span>
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{uniqueFilteredUsersCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Distinct user accounts logged in filtered period
          </div>
        </div>

        {/* Card 3: Most Frequent Action */}
        <div className="bg-gradient-to-br from-white to-emerald-50/30 p-5 rounded-3xl border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-900/60 uppercase tracking-wider">
              Most Frequent Action
            </span>
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 truncate">
            {mostFrequentActionInfo.label}
          </div>
          <div className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-100/80 rounded-full font-bold">
              {mostFrequentActionInfo.count} event{mostFrequentActionInfo.count === 1 ? '' : 's'}
            </span>
            {mostFrequentActionInfo.count > 0 && (
              <span className="text-slate-500 font-medium">
                ({mostFrequentActionInfo.percentage}% of filtered logs)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filtering Toolbar View */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          <span>Filter System Actions & Log Dataset</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, IP, OS, browser, metadata..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by User ID / Actor Dropdown */}
          <div className="md:col-span-3">
            <select
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option key="all" value="all">👥 Filter by User ID / Actor (All)</option>
              {uniqueUserOptions.map((actor, idx) => (
                <option key={actor.key || `actor-${idx}`} value={actor.key || ''}>
                  {actor.name} {actor.userId ? `[ID: ${actor.userId}]` : ''} ({actor.count} log{actor.count === 1 ? '' : 's'})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Action Type Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  ⚡ {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Time Range Dropdown */}
          <div className="md:col-span-2">
            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option key="all" value="all">📅 All Time</option>
              <option key="today" value="today">Today</option>
              <option key="24h" value="24h">Last 24 Hours</option>
              <option key="7d" value="7d">Last 7 Days</option>
              <option key="30d" value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Clear Button */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span>Showing <strong className="text-slate-900">{filteredLogs.length}</strong> of <strong className="text-slate-900">{logs.length}</strong> system action logs</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Logs Table / Card List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl w-fit mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No matching activity logs found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try modifying your search keywords, selected user ID, or action type category filter.
            </p>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {filteredLogs.map((log) => {
                const badge = getActionBadge(log.actionType);
                const BadgeIcon = badge.icon;
                const isExpanded = expandedLogId === log.id || showMetadataToggle;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(219, 234, 254, 0.4)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255, 255, 255, 0)' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="transition-colors border-b border-slate-100 last:border-b-0 overflow-hidden"
                  >
                    {/* Primary Row Header */}
                    <div
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/80 transition-colors ${
                        isExpanded ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Left Icon + Description */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-2xl border shrink-0 mt-0.5 ${badge.color}`}>
                          <BadgeIcon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm leading-snug">
                              {log.description}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {/* Actor + Basic Metadata Tag Preview */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <User className="w-3 h-3 text-slate-400" />
                              {log.actor}
                              {log.actorUserId && (
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                  ID: {log.actorUserId}
                                </span>
                              )}
                            </span>

                            {log.ipAddress && (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <Globe className="w-3 h-3 text-slate-400" />
                                IP: {log.ipAddress}
                              </span>
                            )}

                            {(log.browser || log.os) && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {getDeviceIcon(log.deviceType)}
                                <span>OS: {log.os || 'Unknown'}</span>
                                <span>•</span>
                                <span>Browser: {log.browser ? log.browser.split(' ')[0] : 'Unknown'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Timestamp & Expand Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {new Date(log.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>

                        <div className={`p-1.5 rounded-xl border text-slate-400 transition-colors ${
                          isExpanded ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Granular Details Panel (Details-on-Click or Global Metadata Toggle) */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-5 pt-1 bg-slate-50/90 border-t border-slate-100 space-y-4">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2 flex items-center justify-between">
                          <span>Granular Action Diagnostics & Session Metadata</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">Log ID: {log.id}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* 1. Network & Security Box */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                              <Globe className="w-4 h-4 text-blue-500" />
                              <span>Network & Client IP</span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">IP Address:</span>
                                <div className="flex items-center gap-1 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  <span>{log.ipAddress || '127.0.0.1 (Local)'}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(log.ipAddress || '127.0.0.1', `ip-${log.id}`);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                    title="Copy IP Address"
                                  >
                                    {copiedId === `ip-${log.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Time Zone:</span>
                                <span className="font-semibold text-slate-800">{log.timeZone || 'UTC'}</span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">System Language:</span>
                                <span className="font-semibold text-slate-800">{log.language || 'en-US'}</span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Current Page Path:</span>
                                <span className="font-mono text-[11px] font-semibold text-blue-600 truncate max-w-[150px]">
                                  {log.path || '/'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Device & Browser OS Box */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                              <Monitor className="w-4 h-4 text-purple-500" />
                              <span>Browser & OS Environment</span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Browser:</span>
                                <span className="font-semibold text-slate-800">{log.browser || 'Google Chrome'}</span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Operating System:</span>
                                <span className="font-semibold text-slate-800">{log.os || 'Windows 11'}</span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Device Category:</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  {getDeviceIcon(log.deviceType)}
                                  {log.deviceType || 'Desktop'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Display Resolution:</span>
                                <span className="font-mono text-[11px] text-slate-700">
                                  {log.screenResolution || '1920x1080'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Viewport Window:</span>
                                <span className="font-mono text-[11px] text-slate-700">
                                  {log.viewportSize || '1440x900'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3. User & Actor Session Box */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                              <User className="w-4 h-4 text-emerald-500" />
                              <span>Actor User Credentials</span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Actor Name:</span>
                                <span className="font-bold text-slate-900">{log.actor}</span>
                              </div>

                              {log.actorEmail && (
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">Email Address:</span>
                                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                                    {log.actorEmail}
                                  </span>
                                </div>
                              )}

                              {log.actorRole && (
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">User Role:</span>
                                  <span className="uppercase text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                                    {log.actorRole}
                                  </span>
                                </div>
                              )}

                              {log.actorUserId && (
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">User ID:</span>
                                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[130px]">
                                    {log.actorUserId}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Exact Timestamp:</span>
                                <span className="font-mono text-[11px] text-slate-600">
                                  {log.timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Application Error Diagnostics for Admin Debugging */}
                        {(log.actionType === 'app_error' || log.errorMessage || log.errorStack) && (
                          <div className="bg-rose-950/90 border border-rose-800 p-4 rounded-2xl text-xs space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-rose-300 pb-2 border-b border-rose-800/80">
                              <span className="flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-rose-400" />
                                Exception Diagnostic Stack & Context
                              </span>
                              {log.errorName && (
                                <span className="font-mono text-[10px] bg-rose-900/60 text-rose-200 px-2 py-0.5 rounded border border-rose-700/60">
                                  {log.errorName}
                                </span>
                              )}
                            </div>

                            {log.errorMessage && (
                              <div className="space-y-1">
                                <span className="text-2xs font-bold text-rose-300 uppercase">Error Message:</span>
                                <div className="font-mono text-xs text-rose-100 bg-slate-950 p-2.5 rounded-xl border border-rose-900/60 font-semibold">
                                  {log.errorMessage}
                                </div>
                              </div>
                            )}

                            {log.errorStack && (
                              <div className="space-y-1">
                                <span className="text-2xs font-bold text-rose-300 uppercase">Stack Trace:</span>
                                <pre className="font-mono text-[11px] text-rose-200 bg-slate-950/90 p-3 rounded-xl border border-rose-900/60 overflow-x-auto max-h-48 leading-relaxed">
                                  {log.errorStack}
                                </pre>
                              </div>
                            )}

                            {log.componentStack && (
                              <div className="space-y-1">
                                <span className="text-2xs font-bold text-rose-300 uppercase">Component Stack Trace:</span>
                                <pre className="font-mono text-[10px] text-rose-300 bg-slate-950/90 p-3 rounded-xl border border-rose-900/60 overflow-x-auto max-h-36 leading-relaxed">
                                  {log.componentStack}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* User Agent Raw String Bar */}
                        {log.userAgent && (
                          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Full User-Agent Header String:
                            </div>
                            <div className="font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 break-all select-all">
                              {log.userAgent}
                            </div>
                          </div>
                        )}

                        {/* Contextual Payload Metadata (JSON viewer) */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <Terminal className="w-3.5 h-3.5" />
                                Payload & Contextual Event Metadata
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(JSON.stringify(log.metadata, null, 2), `meta-${log.id}`);
                                }}
                                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                              >
                                {copiedId === `meta-${log.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy JSON</span>
                              </button>
                            </div>

                            <pre className="font-mono text-[11px] text-emerald-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 overflow-x-auto leading-relaxed">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
