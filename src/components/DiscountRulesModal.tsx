import React, { useState, useEffect } from 'react';
import { DiscountRule, DiscountType, ClassType } from '../types';
import { X, Settings2, Plus, Trash2, CheckCircle2, ShieldAlert, Layers, Tag, Info, Edit2 } from 'lucide-react';

interface DiscountRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountRules: DiscountRule[];
  setDiscountRules: React.Dispatch<React.SetStateAction<DiscountRule[]>>;
  classTypes: ClassType[];
  onSaveClassType: (classType: ClassType) => void;
  onDeleteClassType: (id: string) => void;
}

export const DiscountRulesModal: React.FC<DiscountRulesModalProps> = ({
  isOpen,
  onClose,
  discountRules,
  setDiscountRules,
  classTypes,
  onSaveClassType,
  onDeleteClassType,
}) => {
  const [activeTab, setActiveTab] = useState<'discounts' | 'classTypes'>('discounts');

  // Discount Rule State
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<DiscountType>('percentage_multi_class');
  const [newTargetClassType, setNewTargetClassType] = useState<string>('');
  const [newAppliesToSbaHub, setNewAppliesToSbaHub] = useState<boolean | undefined>(undefined);
  const [newMinClasses, setNewMinClasses] = useState<number>(2);
  const [newMinAmount, setNewMinAmount] = useState<number>(200);
  const [newPercentOff, setNewPercentOff] = useState<number>(10);
  const [newFlatOff, setNewFlatOff] = useState<number>(20);
  const [newPromoCode, setNewPromoCode] = useState<string>('');

  useEffect(() => {
    if (isOpen && classTypes.length > 0) {
      if (!newTargetClassType || !classTypes.some(ct => ct.code === newTargetClassType || ct.name === newTargetClassType)) {
        setNewTargetClassType(classTypes[0].code || classTypes[0].name);
      }
    }
  }, [isOpen, classTypes, newTargetClassType]);

  // Class Type Editor State
  const [editingClassTypeId, setEditingClassTypeId] = useState<string | null>(null);
  const [ctName, setCtName] = useState('');
  const [ctCode, setCtCode] = useState('');
  const [ctDescription, setCtDescription] = useState('');

  if (!isOpen) return null;

  const toggleRuleEnabled = (id: string) => {
    setDiscountRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteRule = (id: string) => {
    setDiscountRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEditRuleClick = (rule: DiscountRule) => {
    setEditingRuleId(rule.id);
    setNewRuleName(rule.name);
    setNewRuleType(rule.type);
    setNewTargetClassType(rule.targetClassType || (classTypes[0]?.code || ''));
    setNewAppliesToSbaHub(rule.appliesToSbaHub);
    setNewMinClasses(rule.minClassesRequired || 2);
    setNewMinAmount(rule.minAmountRequired || 200);
    setNewPercentOff(rule.percentageOff || 10);
    setNewFlatOff(rule.flatAmountOff || 20);
    setNewPromoCode(rule.code || '');
  };

  const cancelRuleEdit = () => {
    setEditingRuleId(null);
    setNewRuleName('');
    setNewPromoCode('');
    setNewRuleType('percentage_multi_class');
    setNewTargetClassType(classTypes[0]?.code || '');
    setNewAppliesToSbaHub(undefined);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    let desc = '';
    const categoryLabel = `${newTargetClassType} class`;
    const targetLabel = newAppliesToSbaHub === true ? 'SBA Hub' : newAppliesToSbaHub === false ? 'regular' : 'both regular & SBA Hub';

    if (newRuleType === 'percentage_multi_class') {
      desc = `Enroll in ${newMinClasses} or more ${categoryLabel}es to save ${newPercentOff}% off ${targetLabel} tuition.`;
    } else if (newRuleType === 'amount_threshold') {
      desc = `Spend $${newMinAmount} or more to get $${newFlatOff} off total tuition.`;
    } else if (newRuleType === 'sibling') {
      desc = `Enrolling a sibling unlocks $${newFlatOff} off tuition.`;
    } else if (newRuleType === 'promo_code') {
      desc = `Enter promo code ${newPromoCode.toUpperCase()} for ${
        newPercentOff ? `${newPercentOff}% off` : `$${newFlatOff} off`
      } tuition.`;
    }

    if (editingRuleId) {
      const updated: DiscountRule = {
        id: editingRuleId,
        name: newRuleName,
        type: newRuleType,
        enabled: true,
        targetClassType: newTargetClassType,
        appliesToSbaHub: newAppliesToSbaHub,
        minClassesRequired: newMinClasses,
        minAmountRequired: newMinAmount,
        percentageOff: newPercentOff,
        flatAmountOff: newFlatOff,
        code: newPromoCode ? newPromoCode.toUpperCase() : undefined,
        description: desc,
      };
      setDiscountRules((prev) => prev.map((r) => (r.id === editingRuleId ? updated : r)));
      setEditingRuleId(null);
    } else {
      const created: DiscountRule = {
        id: `rule-custom-${Date.now()}`,
        name: newRuleName,
        type: newRuleType,
        enabled: true,
        targetClassType: newTargetClassType,
        appliesToSbaHub: newAppliesToSbaHub,
        minClassesRequired: newMinClasses,
        minAmountRequired: newMinAmount,
        percentageOff: newPercentOff,
        flatAmountOff: newFlatOff,
        code: newPromoCode ? newPromoCode.toUpperCase() : undefined,
        description: desc,
      };
      setDiscountRules((prev) => [...prev, created]);
    }

    setNewRuleName('');
    setNewPromoCode('');
    setNewAppliesToSbaHub(false);
  };

  const handleAddOrUpdateClassType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctName.trim() || !ctCode.trim()) return;

    const newCt: ClassType = {
      id: editingClassTypeId || `ct-${Date.now()}`,
      name: ctName.trim(),
      code: ctCode.trim().toUpperCase(),
      description: ctDescription.trim() || `${ctName.trim()} Class Type`,
      isSbaHub: false,
    };

    onSaveClassType(newCt);
    setEditingClassTypeId(null);
    setCtName('');
    setCtCode('');
    setCtDescription('');
  };

  const handleEditClassTypeClick = (ct: ClassType) => {
    setEditingClassTypeId(ct.id);
    setCtName(ct.name);
    setCtCode(ct.code);
    setCtDescription(ct.description || '');
  };

  const cancelClassTypeEdit = () => {
    setEditingClassTypeId(null);
    setCtName('');
    setCtCode('');
    setCtDescription('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-purple-300" />
            <div>
              <h2 className="text-base font-bold text-white">Discounts & Class Types Manager</h2>
              <p className="text-xs text-purple-200">
                Categorize tuition discounts by class type (CSEC, CAPE, etc.) & include SBA Hub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-purple-50/50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('discounts')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'discounts'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categorized Discounts ({discountRules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('classTypes')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'classTypes'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Class Types Management ({classTypes.length})</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Important Policy Note */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Discount Policy Notice:</strong> SBA Hub offerings are fully <u>included</u> in tuition discount calculations. You can configure discounts based on SBA Hub as well as CSEC/CAPE grade levels.
            </div>
          </div>

          {activeTab === 'discounts' && (
            <>
              {/* Active Rules List */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Active Categorized Rules ({discountRules.length})
                </h3>
                <div className="space-y-3">
                  {discountRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        rule.enabled
                          ? 'bg-purple-50/50 border-purple-200'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleRuleEnabled(rule.id)}
                          className={`mt-0.5 p-1 rounded-md transition-colors ${
                            rule.enabled
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                          title={rule.enabled ? 'Click to Disable' : 'Click to Enable'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="text-sm font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                            <span>{rule.name}</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200">
                              Target: {rule.targetClassType || 'ALL'}
                            </span>
                             <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              rule.appliesToSbaHub === true
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : rule.appliesToSbaHub === false
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              Applies To: {rule.appliesToSbaHub === true ? 'SBA Hub' : rule.appliesToSbaHub === false ? 'Regular' : 'Both'}
                            </span>
                            {rule.code && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded">
                                CODE: {rule.code}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditRuleClick(rule)}
                          className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add / Edit Discount Rule Form */}
              <form onSubmit={handleAddRule} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-4">
                <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-purple-600" />
                    {editingRuleId ? 'Edit Discount Rule' : 'Add Categorized Discount Rule'}
                  </span>
                  {editingRuleId && (
                    <button
                      type="button"
                      onClick={cancelRuleEdit}
                      className="text-[11px] text-purple-700 underline font-normal"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g., CSEC 2+ Class Discount (10% Off)"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Target Class Type / Category
                    </label>
                    <select
                      value={newTargetClassType}
                      onChange={(e) => setNewTargetClassType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-bold text-purple-900 bg-white"
                    >
                      {classTypes.map((ct) => (
                        <option key={ct.id} value={ct.code || ct.name}>
                          {ct.name} ({ct.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Applies To
                    </label>
                    <select
                      value={newAppliesToSbaHub === true ? 'sba' : newAppliesToSbaHub === false ? 'regular' : 'both'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'sba') setNewAppliesToSbaHub(true);
                        else if (val === 'regular') setNewAppliesToSbaHub(false);
                        else setNewAppliesToSbaHub(undefined);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-bold text-slate-700 bg-white"
                    >
                      <option value="both">Both Regular & SBA Hub</option>
                      <option value="regular">Regular Academic Classes Only</option>
                      <option value="sba">SBA Hub Classes Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value as DiscountType)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="percentage_multi_class">Multi-Class Count in Category (%)</option>
                      <option value="amount_threshold font-normal">Category Spend Dollar Threshold ($)</option>
                      <option value="sibling">Sibling / Second Student ($)</option>
                      <option value="promo_code">Promo Code</option>
                    </select>
                  </div>

                  {newRuleType === 'percentage_multi_class' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Min Classes
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newMinClasses}
                          onChange={(e) => setNewMinClasses(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          % Off Category
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={newPercentOff}
                          onChange={(e) => setNewPercentOff(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {newRuleType === 'amount_threshold' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Min Spend ($)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newMinAmount}
                          onChange={(e) => setNewMinAmount(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Flat Off ($)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newFlatOff}
                          onChange={(e) => setNewFlatOff(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {newRuleType === 'promo_code' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Code
                        </label>
                        <input
                          type="text"
                          required
                          value={newPromoCode}
                          onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                          placeholder="e.g. CSEC2026"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Flat Off ($)
                        </label>
                        <input
                          type="number"
                          value={newFlatOff}
                          onChange={(e) => setNewFlatOff(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {newRuleType === 'sibling' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Sibling Reward Off ($)
                      </label>
                      <input
                        type="number"
                        value={newFlatOff}
                        onChange={(e) => setNewFlatOff(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingRuleId ? 'Update Discount Rule' : 'Save Categorized Rule'}</span>
                </button>
              </form>
            </>
          )}

          {activeTab === 'classTypes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Admin-Configured Class Types ({classTypes.length})
                </h3>
                <div className="space-y-2.5">
                  {classTypes.map((ct) => (
                    <div
                      key={ct.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{ct.name}</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-mono font-bold rounded">
                            {ct.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{ct.description}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClassTypeClick(ct)}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Class Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteClassType(ct.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Class Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add / Edit Class Type Form */}
              <form onSubmit={handleAddOrUpdateClassType} className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-purple-600" />
                    {editingClassTypeId ? 'Edit Class Type' : 'Create New Class Type'}
                  </span>
                  {editingClassTypeId && (
                    <button
                      type="button"
                      onClick={cancelClassTypeEdit}
                      className="text-[11px] text-purple-700 underline font-normal"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Class Type Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., CSEC, CAPE, Primary, Cambridge"
                      value={ctName}
                      onChange={(e) => setCtName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Category Code / Tag *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., CSEC, CAPE, PRIMARY"
                      value={ctCode}
                      onChange={(e) => setCtCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Secondary level subjects for CSEC exams"
                    value={ctDescription}
                    onChange={(e) => setCtDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingClassTypeId ? 'Update Class Type' : 'Save New Class Type'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
