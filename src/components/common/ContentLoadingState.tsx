import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface ContentLoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ContentLoadingState: React.FC<ContentLoadingStateProps> = ({
  message = 'Loading data...',
  submessage,
  size = 'md',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 text-center select-none ${className}`}
      role="status"
    >
      <div className="relative mb-3 flex items-center justify-center">
        {!shouldReduceMotion && (
          <motion.div
            className="absolute w-12 h-12 rounded-full bg-teal-500/10 blur-md"
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 shadow-xs flex items-center justify-center"
        >
          <img
            src="/logo.png"
            alt="Shaw STEM Academy"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
        </motion.div>
      </div>

      <div className="space-y-1">
        <p className={`font-semibold text-slate-700 dark:text-slate-200 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {message}
        </p>
        {submessage && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {submessage}
          </p>
        )}
      </div>

      <div className="mt-3 w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full w-1/2 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full"
          animate={shouldReduceMotion ? { opacity: [0.4, 1, 0.4] } : { x: ['-100%', '200%'] }}
          transition={
            shouldReduceMotion
              ? { duration: 1, repeat: Infinity }
              : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </div>
    </div>
  );
};
