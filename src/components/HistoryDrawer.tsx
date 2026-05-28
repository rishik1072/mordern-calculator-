import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryEntry } from '../utils/calculatorEngine';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onUseEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  theme: 'dark' | 'light';
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onUseEntry,
  onClearHistory,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40"
            style={{ background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 35,
              mass: 0.8,
            }}
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden
              ${isDark ? 'bg-[#1c1c1e]' : 'bg-white'}`}
            style={{
              maxHeight: '75vh',
              boxShadow: isDark
                ? '0 -20px 60px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.06)'
                : '0 -20px 60px rgba(0,0,0,0.15), 0 -1px 0 rgba(0,0,0,0.05)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b
              ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
            >
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
                style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif" }}
              >
                History
              </h2>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClearHistory}
                    className={`text-sm font-medium px-3 py-1.5 rounded-xl transition-colors
                      ${isDark
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-red-500 hover:bg-red-50'
                      }`}
                  >
                    Clear All
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`text-sm font-medium px-3 py-1.5 rounded-xl
                    ${isDark
                      ? 'text-[#FF9F0A] hover:bg-[#FF9F0A]/10'
                      : 'text-[#FF9F0A] hover:bg-[#FF9F0A]/10'
                    }`}
                >
                  Done
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 100px)' }}>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className={`text-5xl opacity-20 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🧮
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No calculations yet
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {history.map((entry, idx) => (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onUseEntry(entry); onClose(); }}
                      className={`w-full flex items-center justify-between px-5 py-3.5 text-left
                        border-b transition-colors
                        ${isDark ? 'border-gray-800/50' : 'border-gray-50'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                          style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", fontWeight: 300 }}
                        >
                          {entry.expression}
                        </p>
                        <p className={`text-xl font-light mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}
                          style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif" }}
                        >
                          = {entry.result}
                        </p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                          ${isDark ? 'bg-[#FF9F0A]/15 text-[#FF9F0A]' : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'}`}
                        >
                          Use
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryDrawer;
