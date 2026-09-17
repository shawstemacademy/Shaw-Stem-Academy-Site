import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface LogoLoadingScreenProps {
  /** Display variant */
  variant?: 'fullscreen' | 'overlay' | 'inline' | 'compact';
  /** Primary title */
  title?: string;
  /** Subtitle or school motto */
  subtitle?: string;
  /** Status or loading message */
  message?: string;
  /** Progress percentage (0-100), or undefined for continuous pulse/shimmer */
  progress?: number;
  /** Optional helpful tip or sub-note */
  tip?: string;
  /** Custom logo path, defaults to existing '/logo.png' */
  logoSrc?: string;
  /** Logo dimension sizing */
  size?: 'sm' | 'md' | 'lg';
  /** Optional CSS class extensions */
  className?: string;
}

export const LogoLoadingScreen: React.FC<LogoLoadingScreenProps> = ({
  variant = 'fullscreen',
  title = 'Shaw STEM Academy',
  subtitle = 'Innovate • Explore • Lead',
  message = 'Loading portal...',
  progress,
  tip,
  logoSrc = '/logo.png',
  size = variant === 'fullscreen' ? 'lg' : variant === 'inline' ? 'md' : 'md',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Size mappings preserving aspect ratio
  const sizeConfig = {
    sm: {
      container: 'w-12 h-12',
      glow: 'w-16 h-16',
      title: 'text-sm',
      sub: 'text-[10px]',
      track: 'w-36 h-1',
    },
    md: {
      container: 'w-16 h-16 sm:w-20 sm:h-20',
      glow: 'w-24 h-24 sm:w-28 sm:h-28',
      title: 'text-base sm:text-lg',
      sub: 'text-xs',
      track: 'w-44 sm:w-52 h-1.5',
    },
    lg: {
      container: 'w-24 h-24 sm:w-28 sm:h-28',
      glow: 'w-36 h-36 sm:w-40 sm:h-40',
      title: 'text-xl sm:text-2xl',
      sub: 'text-xs sm:text-sm',
      track: 'w-52 sm:w-64 h-1.5',
    },
  }[size];

  const content = (
    <div className="flex flex-col items-center text-center select-none max-w-sm mx-auto">
      {/* Logo container with subtle ambient glow and micro-scale animation */}
      <div className="relative flex items-center justify-center mb-5">
        {/* Ambient subtle glow effect matching brand colors */}
        {!shouldReduceMotion && (
          <motion.div
            className={`absolute rounded-full bg-teal-500/15 dark:bg-teal-400/20 blur-xl pointer-events-none ${sizeConfig.glow}`}
            animate={{
              scale: [0.9, 1.12, 0.9],
              opacity: [0.35, 0.7, 0.35],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Existing Shaw STEM Academy Logo element - untouched original asset */}
        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
          animate={{
            opacity: 1,
            scale: shouldReduceMotion ? 1 : [1, 1.025, 1],
          }}
          transition={{
            opacity: { duration: 0.25, ease: 'easeOut' },
            scale: shouldReduceMotion
              ? { duration: 0 }
              : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
          }}
          className={`relative z-10 ${sizeConfig.container} flex items-center justify-center p-1 rounded-2xl bg-slate-900/60 dark:bg-slate-950/80 border border-slate-700/50 shadow-xl overflow-hidden`}
        >
          <img
            src={logoSrc}
            alt="Shaw STEM Academy"
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback guarantee if logo URL fails
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
        </motion.div>
      </div>

      {/* Title & Motto */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.1 }}
        className="space-y-1 mb-4"
      >
        <h2 className={`font-extrabold tracking-tight text-white dark:text-slate-100 ${sizeConfig.title}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`font-medium tracking-wide text-teal-400 dark:text-teal-300 ${sizeConfig.sub}`}>
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Progress Element / Animated Bar */}
      <div className="space-y-2.5 flex flex-col items-center">
        <div
          className={`relative bg-slate-800/90 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 ${sizeConfig.track}`}
          role="progressbar"
          aria-valuenow={progress !== undefined ? progress : undefined}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {progress !== undefined ? (
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 via-blue-500 to-teal-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          ) : (
            <motion.div
              className="h-full w-1/3 bg-gradient-to-r from-teal-400 via-blue-400 to-teal-300 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)]"
              animate={
                shouldReduceMotion
                  ? { opacity: [0.5, 1, 0.5] }
                  : {
                      x: ['-100%', '320%'],
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : {
                      duration: 1.4,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.2, 1],
                    }
              }
            />
          )}
        </div>

        {/* Dynamic Status Message */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="text-xs text-slate-300 dark:text-slate-400 font-medium tracking-normal flex items-center gap-1.5"
          >
            <span>{message}</span>
          </motion.p>
        )}
      </div>

      {/* Optional Helpful Tip Box */}
      {tip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-6 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-xs text-center shadow-inner"
        >
          <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
            {tip}
          </p>
        </motion.div>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <motion.div
        key="fullscreen-logo-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0.1 : 0.35, ease: 'easeInOut' } }}
        className={`fixed inset-0 z-[120] bg-slate-950 flex flex-col items-center justify-center p-6 text-white ${className}`}
        role="status"
        aria-live="polite"
      >
        {content}
      </motion.div>
    );
  }

  if (variant === 'overlay') {
    return (
      <motion.div
        key="overlay-logo-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0.1 : 0.25 } }}
        className={`fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <motion.div
          initial={{ scale: shouldReduceMotion ? 1 : 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: shouldReduceMotion ? 1 : 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-auto"
        >
          {content}
        </motion.div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-4 flex flex-col items-center justify-center ${className}`} role="status">
        {content}
      </div>
    );
  }

  // Inline variant (inside cards, dashboards, or tabs)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
      className={`w-full py-16 px-4 flex flex-col items-center justify-center min-h-[260px] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-slate-900/60 dark:bg-slate-950/60 border border-slate-800/80 p-8 rounded-3xl shadow-lg backdrop-blur-xs">
        {content}
      </div>
    </motion.div>
  );
};
