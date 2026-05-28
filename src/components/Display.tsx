import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisplayProps {
  display: string;
  expression: string;
  preview: string;
  angleMode: 'DEG' | 'RAD';
  memoryHasValue: boolean;
  theme: 'dark' | 'light';
  isError: boolean;
  onSwipeDelete: () => void;
  onCopy: () => void;
}

function getDisplayFontSize(text: string): string {
  const len = text.length;
  if (len <= 6)  return '5rem';
  if (len <= 9)  return '4.25rem';
  if (len <= 12) return '3.5rem';
  if (len <= 15) return '2.75rem';
  if (len <= 20) return '2.25rem';
  return '1.75rem';
}

const Display: React.FC<DisplayProps> = ({
  display,
  expression,
  preview,
  angleMode,
  memoryHasValue,
  theme,
  isError,
  onSwipeDelete,
  onCopy,
}) => {
  const isDark = theme === 'dark';
  const touchStartX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const [copied, setCopied] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const timeDiff = Date.now() - touchStartTime.current;
    if (diff > 60 && timeDiff < 500) {
      onSwipeDelete();
    }
  }, [onSwipeDelete]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
    onCopy();
  }, [display, onCopy]);

  const showExpression = expression && expression !== display && expression !== '0' && !isError;
  const displayText = display === '' ? '0' : display;
  const fontSize = getDisplayFontSize(displayText);

  return (
    <div
      className="relative flex flex-col justify-end overflow-hidden select-none"
      style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '8px', paddingBottom: '12px' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Status indicators row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {memoryHasValue && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: -6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full
                  ${isDark
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                    : 'bg-orange-500/15 text-orange-600 border border-orange-500/15'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                M
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full
                  ${isDark
                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                    : 'bg-green-500/15 text-green-600 border border-green-500/15'
                  }`}
              >
                ✓ Copied
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={`text-xs font-bold px-2.5 py-1 rounded-full tracking-wide
              ${isDark
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/15'
                : 'bg-blue-500/10 text-blue-600 border border-blue-500/10'
              }`}
          >
            {angleMode}
          </div>
        </div>
      </div>

      {/* Expression (history line) */}
      <div className="flex justify-end min-h-[26px] mb-1">
        <AnimatePresence mode="popLayout">
          {showExpression && (
            <motion.p
              key={expression.slice(-30)}
              initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 0.45, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`text-right text-lg leading-tight truncate max-w-full
                ${isDark ? 'text-white' : 'text-gray-700'}`}
              style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                fontWeight: 300,
                letterSpacing: '-0.01em',
              }}
            >
              {expression}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Main number display */}
      <div className="flex justify-end items-end">
        <motion.div
          key={displayText}
          initial={{ opacity: 0.7, scale: 0.97, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.6 }}
          className={`text-right leading-none cursor-pointer select-none
            ${isError ? 'text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}
          style={{
            fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
            fontWeight: 200,
            fontSize,
            letterSpacing: '-0.03em',
            textShadow: isDark && !isError
              ? '0 0 60px rgba(255,255,255,0.05)'
              : 'none',
            maxWidth: '100%',
            wordBreak: 'break-all',
            lineHeight: 1.0,
          }}
          onClick={handleCopy}
          title="Tap to copy"
        >
          {displayText}
        </motion.div>
      </div>

      {/* Preview / equals hint */}
      <div className="flex justify-end min-h-[22px] mt-1.5">
        <AnimatePresence>
          {preview && preview !== display && !isError && (
            <motion.p
              key={preview}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.5, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={`text-right text-sm leading-none
                ${isDark ? 'text-white' : 'text-gray-600'}`}
              style={{
                fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              = {preview}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Display;
