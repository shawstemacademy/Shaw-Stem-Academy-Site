import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export interface PageTransitionProps {
  children: React.ReactNode;
  /** Unique key for the page or tab */
  pageKey?: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  pageKey,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pageKey}
      initial={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : -8,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.1 : 0.22,
        ease: [0.16, 1, 0.3, 1], // standard fluid out-cubic curve
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
