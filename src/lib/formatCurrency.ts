/**
 * Currency Formatting Utility
 * Enforces USD ($ / USD) formatting across all forms, receipts, tuition fees, and money displays.
 */

export function formatUSD(amount: number | string | undefined | null, showCents: boolean = true): string {
  if (amount === undefined || amount === null || amount === '') return '$0.00 USD';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  if (isNaN(num)) return '$0.00 USD';

  const formattedNumber = showCents
    ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(num).toLocaleString('en-US');

  return `$${formattedNumber} USD`;
}

/**
 * Short USD representation without decimals if whole, or with decimals if fraction
 */
export function formatUSDCompact(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '$0 USD';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  if (isNaN(num)) return '$0 USD';

  const hasDecimal = num % 1 !== 0;
  return formatUSD(num, hasDecimal);
}
