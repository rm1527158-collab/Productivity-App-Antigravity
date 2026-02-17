import React from 'react';
import { motion } from 'framer-motion';

/**
 * LiveIndicator - Shows a pulsing green dot to indicate live data syncing
 */
const LiveIndicator = ({ label = "Live" }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inline-flex h-full w-full rounded-full bg-green-400"
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </div>
      {label && (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          {label}
        </span>
      )}
    </div>
  );
};

export default LiveIndicator;
