import React, { useState } from 'react';
import { ClassItem, AppliedDiscount, DiscountRule, FormTheme, SbaHubOption } from '../types';
import {
  Calculator,
  Tag,
  Check,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Gift,
  PlusCircle,
} from 'lucide-react';
import { formatUSD } from '../lib/formatCurrency';

interface RunningTotalCardProps {
  currentRole?: string | null;
  selectedClasses: ClassItem[];
  sbaHubOptions?: SbaHubOption[];
  selectedSbaHubIds?: string[];
  subtotal: number;
  appliedDiscounts: AppliedDiscount[];
  totalPrice: number;
  promoCodeInput: string;
  setPromoCodeInput: (code: string) => void;
  promoError: string;
  promoSuccess: string;
  onApplyPromoCode: (e: React.FormEvent) => void;
  discountRules: DiscountRule[];
  theme: FormTheme;
  onSubmitRegistration: () => void;
  onOpenDiscountConfig: () => void;
}

export const RunningTotalCard: React.FC<RunningTotalCardProps> = ({
  currentRole,
  selectedClasses,
  sbaHubOptions = [],
  selectedSbaHubIds = [],
  subtotal,
  appliedDiscounts,
  totalPrice,
  promoCodeInput,
  setPromoCodeInput,
  promoError,
  promoSuccess,
  onApplyPromoCode,
  discountRules,
  theme,
  onSubmitRegistration,
  onOpenDiscountConfig,
}) => {
  const selectedSbaHubItems = sbaHubOptions ? sbaHubOptions.filter((o) => selectedSbaHubIds?.includes(o.id)) : [];
  const totalItemsCount = selectedClasses.length + selectedSbaHubItems.length;
  const classSubtotal = selectedClasses.reduce((sum, c) => sum + c.price, 0);
  const totalSavings = appliedDiscounts.reduce((sum, d) => sum + d.amountOff, 0);

  // Calculate progress toward next multi-class discount
  const classCount = selectedClasses.length;
  const multiClassRules = discountRules
    .filter((r) => r.enabled && (r.type === 'percentage_multi_class' || r.type === 'class_type_multi_class') && r.minClassesRequired && r.appliesToSbaHub !== true)
    .sort((a, b) => (a.minClassesRequired || 0) - (b.minClassesRequired || 0));

  let nextClassTier = multiClassRules.find((r) => (r.minClassesRequired || 0) > classCount);

  // Calculate progress toward next spend threshold discount
  const spendRules = discountRules
    .filter((r) => r.enabled && r.type === 'amount_threshold' && r.minAmountRequired)
    .sort((a, b) => (a.minAmountRequired || 0) - (b.minAmountRequired || 0));

  let nextSpendTier = spendRules.find((r) => (r.minAmountRequired || 0) > classSubtotal);

  return (
    <>
      {/* Desktop / Main Sidebar Card */}
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 overflow-hidden sticky top-6 transition-all text-xs">
        {/* Header - Compact padding */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              Enrollment Summary
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live Total
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white tracking-tight">
                {formatUSD(totalPrice)}
              </span>
              {totalSavings > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-slate-400 line-through">
                  {formatUSD(subtotal)}
                </span>
              )}
            </div>
            {totalSavings > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] rounded-full">
                Saved {formatUSD(totalSavings)}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Discount Progress Nudges - Compact */}
          {nextClassTier && (
            <div className="p-2.5 bg-blue-950/40 rounded-xl border border-blue-900/40 text-[11px] text-blue-200/95 space-y-0.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-blue-300">
                  <Gift className="w-3.5 h-3.5 text-blue-400" />
                  Next Tier:
                </span>
                <span className="text-blue-400 font-bold">
                  +{nextClassTier.minClassesRequired! - classCount} Class{nextClassTier.minClassesRequired! - classCount > 1 ? 'es' : ''}
                </span>
              </div>
              <p className="text-[10px] text-blue-200/80 leading-snug">
                Enroll in <strong>{nextClassTier.minClassesRequired} classes</strong> to unlock <strong className="text-blue-300">{nextClassTier.percentageOff}% off</strong>!
              </p>
            </div>
          )}

          {nextSpendTier && (
            <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-900/40 text-[11px] text-indigo-200/95 space-y-0.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Spend Reward:
                </span>
                <span className="text-indigo-400 font-bold">
                  +${(nextSpendTier.minAmountRequired! - subtotal).toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-indigo-200/80 leading-snug">
                Spend <strong>${nextSpendTier.minAmountRequired}</strong> to get <strong className="text-indigo-300">${nextSpendTier.flatAmountOff} off</strong>!
              </p>
            </div>
          )}

          {/* Subtotal & Enrolled Items Summary */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Classes Selected ({totalItemsCount})</span>
              <span>Subtotal</span>
            </div>

            {totalItemsCount === 0 ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                No classes selected yet. Click any class to add.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 border-b border-slate-800 pb-1.5">
                {selectedClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between text-[11px] py-0.5">
                    <span className="text-slate-300 truncate max-w-[170px]" title={cls.title}>
                      {cls.title}
                    </span>
                    <span className="font-semibold text-white">{formatUSD(cls.price)}</span>
                  </div>
                ))}
                {selectedSbaHubItems.map((sba) => (
                  <div key={sba.id} className="flex items-center justify-between text-[11px] py-0.5">
                    <span className="text-purple-300 truncate max-w-[170px]" title={sba.name}>
                      {sba.name} <span className="text-[8px] px-1 py-0.1 bg-purple-900/50 text-purple-200 border border-purple-800/40 rounded uppercase font-bold">SBA</span>
                    </span>
                    <span className="font-semibold text-white">{formatUSD(sba.yearlyPrice)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applied Discounts Breakdown - Dense */}
          {appliedDiscounts.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>Applied Discounts ({appliedDiscounts.length})</span>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                {appliedDiscounts.map((discount, i) => (
                  <div
                    key={i}
                    className="p-1.5 bg-emerald-950/20 rounded-lg border border-emerald-900/30 text-[10px] flex items-center justify-between"
                  >
                    <div className="truncate max-w-[160px]">
                      <div className="font-semibold text-emerald-300 truncate">{discount.name}</div>
                      <div className="text-[9px] text-emerald-400/80 truncate">{discount.description}</div>
                    </div>
                    <div className="font-bold text-emerald-450 whitespace-nowrap ml-1 text-xs">
                      -{formatUSD(discount.amountOff)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo Code Form - Dense */}
          <form onSubmit={onApplyPromoCode} className="pt-1.5 border-t border-slate-800 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-slate-300">Have a Promo Code?</label>
              {promoError && <span className="text-[9px] font-medium text-red-400">{promoError}</span>}
              {promoSuccess && <span className="text-[9px] font-medium text-emerald-400">{promoSuccess}</span>}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. EARLYBIRD"
                className="w-full px-2 py-1 text-[11px] bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden uppercase placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Calculation Summary Table - Highly dense */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Tuition Subtotal:</span>
              <span className="font-medium text-slate-200">{formatUSD(subtotal)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Discounts Applied:</span>
                <span>-{formatUSD(totalSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-white pt-1.5 border-t border-slate-800">
              <span>Running Total:</span>
              <span className="text-white text-sm font-black">{formatUSD(totalPrice)}</span>
            </div>
          </div>

          {/* Action Buttons - Compact padding */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={onSubmitRegistration}
              disabled={totalItemsCount === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-2 px-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
            >
              <span>Submit Registration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {(currentRole === 'admin' || currentRole === 'registrar') && (
              <button
                onClick={onOpenDiscountConfig}
                className="w-full py-1 px-2 text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <PlusCircle className="w-3 h-3 text-blue-400" />
                <span>Configure Rules</span>
              </button>
            )}
          </div>

          <div className="text-center text-[9px] text-slate-500 flex items-center justify-center gap-1 pt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Secure Form Integration</span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Running Total Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl p-3 z-40 flex items-center justify-between gap-3 text-white">
        <div>
          <div className="text-[10px] text-slate-400 font-medium">
            Running Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
          </div>
          <div className="text-xl font-bold text-white">
            {formatUSD(totalPrice)}
            {totalSavings > 0 && (
              <span className="ml-1.5 text-xs text-emerald-400 font-bold">
                (Saved {formatUSD(totalSavings)})
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onSubmitRegistration}
          disabled={totalItemsCount === 0}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Complete</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
