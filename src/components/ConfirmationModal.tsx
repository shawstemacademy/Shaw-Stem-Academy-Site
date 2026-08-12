import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
          borderColor: 'border-red-200 dark:border-red-900/50',
          icon: <Trash2 className="w-6 h-6" />,
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
          borderColor: 'border-blue-200 dark:border-blue-900/50',
          icon: <HelpCircle className="w-6 h-6" />,
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
          borderColor: 'border-amber-200 dark:border-amber-900/50',
          icon: <AlertTriangle className="w-6 h-6" />,
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header & Icon */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${colors.iconBg}`}>
                {colors.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-slate-950 dark:text-white leading-6">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-50 dark:bg-slate-950/50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={onConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${colors.btnBg}`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer shadow-xs focus:outline-hidden"
            >
              {cancelText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
