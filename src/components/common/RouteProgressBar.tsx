import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface RouteProgressBarProps {
  /** Triggered whenever route or active tab changes */
  routeKey: string;
}

export const RouteProgressBar: React.FC<RouteProgressBarProps> = ({ routeKey }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // When routeKey changes, briefly animate the top progress bar
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [routeKey]);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[99] pointer-events-none overflow-hidden bg-slate-900/30 backdrop-blur-xs"
      aria-hidden="true"
    >
      <motion.div
        initial={{ width: '0%', opacity: 1 }}
        animate={{
          width: shouldReduceMotion ? '100%' : ['0%', '70%', '100%'],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: shouldReduceMotion ? 0.2 : 0.45,
          ease: 'easeInOut',
        }}
        className="h-full bg-gradient-to-r from-teal-400 via-blue-500 to-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
      />
    </div>
  );
};
