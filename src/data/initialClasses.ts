import { ClassItem, ClassType, DiscountRule, FormTheme, SbaHubOption } from '../types';

export const DEFAULT_CLASS_TYPES: ClassType[] = [];

export const INITIAL_CLASSES: ClassItem[] = [];

export const INITIAL_DISCOUNT_RULES: DiscountRule[] = [];

export const FORM_THEMES: FormTheme[] = [
  {
    id: 'blue',
    name: 'Professional Polish (Blue & Slate)',
    headerBg: 'bg-blue-600',
    headerAccent: 'border-blue-500',
    cardBorderTop: 'border-t-8 border-t-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'purple',
    name: 'Classic Purple',
    headerBg: 'bg-purple-700',
    headerAccent: 'border-purple-600',
    cardBorderTop: 'border-t-8 border-t-purple-600',
    buttonBg: 'bg-purple-700 hover:bg-purple-800 text-white',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'slate',
    name: 'Slate Navy',
    headerBg: 'bg-slate-800',
    headerAccent: 'border-slate-700',
    cardBorderTop: 'border-t-8 border-t-slate-800',
    buttonBg: 'bg-slate-800 hover:bg-slate-900 text-white',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    headerBg: 'bg-teal-700',
    headerAccent: 'border-teal-600',
    cardBorderTop: 'border-t-8 border-t-teal-600',
    buttonBg: 'bg-teal-700 hover:bg-teal-800 text-white',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    headerBg: 'bg-emerald-700',
    headerAccent: 'border-emerald-600',
    cardBorderTop: 'border-t-8 border-t-emerald-600',
    buttonBg: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

export const INITIAL_SBA_HUB_OPTIONS: SbaHubOption[] = [];
