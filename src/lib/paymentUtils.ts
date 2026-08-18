import { ClassItem, SbaHubOption, RegistrationRecord } from '../types';

export interface ClassPaymentStatus {
  classId: string;
  classTitle: string;
  isSbaHub: boolean;
  pricePeriod: 'one-time' | 'month' | 'week' | 'yr' | string;
  price: number;
  lastPaymentDate: Date | null;
  dueDate: Date | null;
  isPaid: boolean;
  isOverdue: boolean;
  daysOverdue: number;
  statusText: 'paid' | 'overdue_unreleased' | 'pending_payment';
}

/**
 * Calculates payment status, due dates, and overdue state for a given class & student registration history.
 */
export function calculateClassPaymentStatus(
  cls: ClassItem | SbaHubOption,
  isSbaHub: boolean,
  registrations: RegistrationRecord[],
  now: Date = new Date()
): ClassPaymentStatus {
  const pricePeriod = isSbaHub ? 'one-time' : (cls.pricePeriod || 'yr');
  const price = 'price' in cls ? cls.price : cls.yearlyPrice;
  const classTitle = 'title' in cls ? cls.title : cls.name;

  // Find all registration records that include this class
  const classRegs = registrations.filter((reg) => {
    if (!reg) return false;
    const hasClass =
      reg.selectedClasses?.some((c) => c.id === cls.id) ||
      reg.selectedClassIds?.includes(cls.id) ||
      reg.verifiedClassIds?.includes(cls.id) ||
      (isSbaHub && reg.studentInfo?.selectedSbaHubIds?.includes(cls.id));
    return hasClass;
  });

  if (classRegs.length === 0) {
    return {
      classId: cls.id,
      classTitle,
      isSbaHub,
      pricePeriod,
      price,
      lastPaymentDate: null,
      dueDate: null,
      isPaid: false,
      isOverdue: false,
      daysOverdue: 0,
      statusText: 'pending_payment',
    };
  }

  // Find latest payment or verified registration timestamp
  let latestPaymentTimestamp: Date | null = null;
  let hasVerifiedPaidStatus = false;

  classRegs.forEach((reg) => {
    if (reg.isPaid || reg.status === 'completed' || reg.status === 'verified') {
      hasVerifiedPaidStatus = true;
    }
    if (reg.timestamp) {
      const tsDate = new Date(reg.timestamp);
      if (!isNaN(tsDate.getTime())) {
        if (!latestPaymentTimestamp || tsDate > latestPaymentTimestamp) {
          latestPaymentTimestamp = tsDate;
        }
      }
    }
    if (reg.payments && Array.isArray(reg.payments)) {
      reg.payments.forEach((p) => {
        if (p.type === 'payment' || !p.type) {
          const pDate = new Date(p.timestamp);
          if (!isNaN(pDate.getTime())) {
            if (!latestPaymentTimestamp || pDate > latestPaymentTimestamp) {
              latestPaymentTimestamp = pDate;
            }
          }
        }
      });
    }
  });

  // SBA Hub classes (one-time payment): lifetime access once paid
  if (pricePeriod === 'one-time') {
    const isPaid = hasVerifiedPaidStatus || Boolean(latestPaymentTimestamp);
    return {
      classId: cls.id,
      classTitle,
      isSbaHub: true,
      pricePeriod: 'one-time',
      price,
      lastPaymentDate: latestPaymentTimestamp,
      dueDate: null, // One-time payment never expires
      isPaid,
      isOverdue: false,
      daysOverdue: 0,
      statusText: isPaid ? 'paid' : 'pending_payment',
    };
  }

  // Regular classes (recurring: week, month, yr)
  if (!latestPaymentTimestamp) {
    return {
      classId: cls.id,
      classTitle,
      isSbaHub: false,
      pricePeriod,
      price,
      lastPaymentDate: null,
      dueDate: null,
      isPaid: false,
      isOverdue: true,
      daysOverdue: 0,
      statusText: 'overdue_unreleased',
    };
  }

  // Calculate Due Date based on last payment date
  const dueDate = new Date(latestPaymentTimestamp);
  if (pricePeriod === 'week') {
    dueDate.setDate(dueDate.getDate() + 7);
  } else if (pricePeriod === 'month') {
    dueDate.setMonth(dueDate.getMonth() + 1);
  } else {
    // 'yr' or 'year'
    dueDate.setFullYear(dueDate.getFullYear() + 1);
  }

  const isOverdue = now > dueDate;
  const diffTime = now.getTime() - dueDate.getTime();
  const daysOverdue = isOverdue ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

  return {
    classId: cls.id,
    classTitle,
    isSbaHub: false,
    pricePeriod,
    price,
    lastPaymentDate: latestPaymentTimestamp,
    dueDate,
    isPaid: !isOverdue,
    isOverdue,
    daysOverdue,
    statusText: isOverdue ? 'overdue_unreleased' : 'paid',
  };
}

/**
 * Format price period display cleanly
 */
export function formatPricePeriod(pricePeriod?: string): string {
  if (!pricePeriod) return '/ yr';
  const p = pricePeriod.toLowerCase().trim();
  if (p === 'one-time' || p === 'onetime' || p === 'one_time') return '/ one-time';
  if (p === 'month' || p === 'mo') return '/ month';
  if (p === 'week' || p === 'wk') return '/ week';
  if (p === 'yr' || p === 'year') return '/ year';
  return `/ ${pricePeriod}`;
}
