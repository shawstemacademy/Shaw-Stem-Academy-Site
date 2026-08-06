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

interface RunningTotalCardProps {
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
  selectedClasses,
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
  const classSubtotal = selectedClasses.reduce((sum, c) => sum + c.price, 0);
  const totalSavings = appliedDiscounts.reduce((sum, d) => sum + d.amountOff, 0);

  // Calculate progress toward next multi-class discount
  const classCount = selectedClasses.length;
  const multiClassRules = discountRules
    .filter((r) => r.enabled && (r.type === 'percentage_multi_class' || r.type === 'class_type_multi_class') && r.minClassesRequired)
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
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 overflow-hidden sticky top-6 transition-all">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-400" />
              Enrollment Summary
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live Total
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white tracking-tight">
                ${totalPrice.toFixed(2)}
              </span>
              {totalSavings > 0 && (
                <span className="ml-2 text-xs font-semibold text-slate-400 line-through">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </div>
            {totalSavings > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-full">
                <TrendingDown className="w-3.5 h-3.5" />
                Saved ${totalSavings.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Discount Progress Nudges */}
          {nextClassTier && (
            <div className="p-3.5 bg-blue-950/60 rounded-xl border border-blue-800/60 text-xs text-blue-200 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-blue-300">
                  <Gift className="w-3.5 h-3.5 text-blue-400" />
                  Next Tier Progress:
                </span>
                <span className="text-blue-400 font-bold">
                  +{nextClassTier.minClassesRequired! - classCount} Class{nextClassTier.minClassesRequired! - classCount > 1 ? 'es' : ''}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                Enroll in <strong>{nextClassTier.minClassesRequired} classes</strong> to unlock a{' '}
                <strong className="text-blue-300">{nextClassTier.percentageOff}% off discount</strong>!
              </p>
            </div>
          )}

          {nextSpendTier && (
            <div className="p-3.5 bg-indigo-950/60 rounded-xl border border-indigo-800/60 text-xs text-indigo-200 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Spend Reward Tier:
                </span>
                <span className="text-indigo-400 font-bold">
                  +${(nextSpendTier.minAmountRequired! - subtotal).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80">
                Spend <strong>${nextSpendTier.minAmountRequired}</strong> to get an extra{' '}
                <strong className="text-indigo-300">${nextSpendTier.flatAmountOff} off</strong>!
              </p>
            </div>
          )}

          {/* Subtotal & Enrolled Items Summary */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Classes Selected ({selectedClasses.length})</span>
              <span>Subtotal</span>
            </div>

            {selectedClasses.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No classes selected yet. Click any class in Section 2 to add it.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                    <span className="text-slate-300 truncate max-w-[200px]" title={cls.title}>
                      {cls.title}
                    </span>
                    <span className="font-semibold text-white">${cls.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applied Discounts Breakdown */}
          {appliedDiscounts.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Applied Discounts ({appliedDiscounts.length})</span>
              </div>
              <div className="space-y-1.5">
                {appliedDiscounts.map((discount, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/50 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-emerald-300">{discount.name}</div>
                      <div className="text-[11px] text-emerald-400/80">{discount.description}</div>
                    </div>
                    <div className="font-bold text-emerald-400 text-sm whitespace-nowrap ml-2">
                      -${discount.amountOff.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Promo Code Form */}
          <form onSubmit={onApplyPromoCode} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Have a Promo Code?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. EARLYBIRD"
                className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase placeholder-slate-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            {promoError && <p className="text-[11px] font-medium text-red-400">{promoError}</p>}
            {promoSuccess && <p className="text-[11px] font-medium text-emerald-400">{promoSuccess}</p>}
          </form>

          {/* Calculation Summary Table */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tuition Subtotal:</span>
              <span className="font-medium text-slate-200">${subtotal.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Discounts Applied:</span>
                <span>-${totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Running Total:</span>
              <span className="text-white text-base">${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-400 italic pt-1">
              * Note: Discounts are categorized by Class Type (CSEC, CAPE, etc.) and exclude SBA Hub items.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onSubmitRegistration}
              disabled={selectedClasses.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/40 transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Submit Registration</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDiscountConfig}
              className="w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Configure Discount Rules</span>
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Google Workspace Form Integration</span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Running Total Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl p-3 z-40 flex items-center justify-between gap-3 text-white">
        <div>
          <div className="text-[10px] text-slate-400 font-medium">
            Running Total ({selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'})
          </div>
          <div className="text-xl font-bold text-white">
            ${totalPrice.toFixed(2)}
            {totalSavings > 0 && (
              <span className="ml-1.5 text-xs text-emerald-400 font-bold">
                (Saved ${totalSavings.toFixed(2)})
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onSubmitRegistration}
          disabled={selectedClasses.length === 0}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Complete</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
