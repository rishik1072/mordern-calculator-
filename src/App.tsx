import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalculator } from './hooks/useCalculator';
import Display from './components/Display';
import StandardKeypad from './components/StandardKeypad';
import ScientificPanel from './components/ScientificPanel';
import HistoryDrawer from './components/HistoryDrawer';
import { formatNumber } from './utils/calculatorEngine';

const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.8 };

export default function App() {
  const { state, actions } = useCalculator();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isInverse, setIsInverse] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [activeOp, setActiveOp] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(new Date());
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = state.theme === 'dark';

  // Clock update
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Splash screen
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (historyOpen) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          navigator.clipboard.writeText(state.display).catch(() => {});
          return;
        }
        if (e.key === 'v') {
          navigator.clipboard.readText().then(text => actions.pasteExpression(text)).catch(() => {});
          return;
        }
        return;
      }

      const key = e.key;

      switch (key) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          actions.inputDigit(key); break;
        case '.': case ',':
          actions.inputDecimal(); break;
        case '+':
          setActiveOp('+'); actions.inputOperator('+'); break;
        case '-':
          setActiveOp('−'); actions.inputOperator('−'); break;
        case '*':
          setActiveOp('×'); actions.inputOperator('×'); break;
        case '/':
          e.preventDefault();
          setActiveOp('÷'); actions.inputOperator('÷'); break;
        case 'Enter': case '=':
          setActiveOp(undefined); actions.calculate(); break;
        case 'Backspace':
          actions.backspace(); break;
        case 'Escape': case 'Delete':
          actions.clear(); setActiveOp(undefined); break;
        case '%':
          actions.percentage(); break;
        case '(':
          actions.inputScientific('('); break;
        case ')':
          actions.inputScientific(')'); break;
        case '^':
          actions.inputScientific('^'); break;
        case 'h': case 'H':
          setHistoryOpen(true); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, state.display, historyOpen]);

  // Reset activeOp when result shown
  useEffect(() => {
    if (state.hasResult) setActiveOp(undefined);
  }, [state.hasResult]);

  const handleOperator = useCallback((op: string) => {
    setActiveOp(op);
    actions.inputOperator(op);
  }, [actions]);

  const handleScientificAction = useCallback((action: string, value?: string) => {
    switch (action) {
      case 'append':
        if (value) actions.inputScientific(value);
        break;
      case 'random':
        actions.inputScientific(formatNumber(Math.random()));
        break;
      case 'angle':
        actions.toggleAngleMode();
        break;
      case 'MC':
        actions.memoryClear();
        break;
      case 'MR':
        actions.memoryRecall();
        break;
      case 'M+':
        actions.memoryAdd();
        break;
      case 'M-':
        actions.memorySubtract();
        break;
      default:
        if (value) actions.inputScientific(value);
    }
  }, [actions]);

  const handleClear = useCallback(() => {
    actions.clear();
    setActiveOp(undefined);
  }, [actions]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(state.display).catch(() => {});
  }, [state.display]);

  const handleDisplayTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => setHistoryOpen(true), 700);
  }, []);

  const handleDisplayTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Responsive: desktop shows phone frame, mobile fills screen
  return (
    <div
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse 120% 80% at 30% -10%, #180a2e 0%, #0d0d12 35%, #000000 100%)'
          : 'radial-gradient(ellipse 120% 80% at 30% -10%, #e8e0f8 0%, #f0f0f5 35%, #e8e8ed 100%)',
      }}
    >
      {/* Background ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute"
          style={{
            top: '-15%', left: '10%',
            width: '70vmin', height: '70vmin',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(120,60,255,0.07) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(120,60,255,0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'ambientPulse 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '5%', right: '10%',
            width: '50vmin', height: '50vmin',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(255,159,10,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,159,10,0.05) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'ambientPulse 7s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute"
          style={{
            top: '40%', left: '-5%',
            width: '40vmin', height: '40vmin',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(0,160,255,0.04) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0,120,255,0.03) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'ambientPulse 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* ═══════════════════════════════ SPLASH SCREEN ══════════════════════════════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: isDark ? '#000000' : '#f5f5f7' }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.15 }}
              className="flex flex-col items-center gap-5"
            >
              {/* Animated app icon */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 20px 60px rgba(255,159,10,0.2)',
                    '0 20px 80px rgba(255,159,10,0.4)',
                    '0 20px 60px rgba(255,159,10,0.2)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-[32px] flex items-center justify-center text-6xl"
                style={{
                  background: 'linear-gradient(145deg, #1e1e2a 0%, #0f0f18 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                🧮
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h1
                  className={`text-3xl tracking-tight text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
                  style={{
                    fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
                    fontWeight: 200,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Calculator
                </h1>
                <p
                  className={`text-xs tracking-[0.25em] uppercase text-center mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif" }}
                >
                  Scientific Edition
                </p>
              </motion.div>

              {/* Loading dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-1.5"
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-orange-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════ CALCULATOR BODY ══════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{
          opacity: showSplash ? 0 : 1,
          y: showSplash ? 50 : 0,
          scale: showSplash ? 0.92 : 1,
        }}
        transition={SPRING_SMOOTH}
        className="relative w-full max-w-[390px] mx-auto flex flex-col"
        style={{ minHeight: '100svh' }}
      >
        {/* Glass Phone Frame */}
        <div
          className="relative flex flex-col w-full h-full min-h-screen sm:min-h-0 sm:rounded-[52px] overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(175deg, #111116 0%, #08080d 60%, #000000 100%)'
              : 'linear-gradient(175deg, #f8f8fa 0%, #f0f0f5 60%, #e8e8ed 100%)',
            boxShadow: isDark
              ? '0 60px 120px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.055), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(255,255,255,0.015)'
              : '0 60px 120px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >

          {/* ── Dynamic Island ── */}
          <div className="flex justify-center pt-4 pb-1.5 flex-shrink-0">
            <motion.div
              initial={{ scaleX: 0.6, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              className="relative overflow-hidden"
              style={{
                width: '120px',
                height: '34px',
                background: isDark ? '#000' : '#111',
                borderRadius: '17px',
                boxShadow: isDark
                  ? 'inset 0 0 0 1px rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.5)'
                  : 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-between px-4">
                {/* FaceID camera area */}
                <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-[#333]" />
                </div>
                {/* Speaker */}
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-0.5 h-2.5 rounded-full bg-[#2a2a2a]" />
                  ))}
                </div>
                {/* Proximity sensor */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] border border-[#252525]" />
              </div>
            </motion.div>
          </div>

          {/* ── Status Bar ── */}
          <div
            className={`flex items-center justify-between px-8 py-0.5 flex-shrink-0
              ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{
              fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            <span>{timeStr.replace(' AM', '').replace(' PM', '')}</span>
            <div className="flex items-center gap-1.5 opacity-90">
              {/* Signal */}
              <svg width="17" height="13" viewBox="0 0 17 13" fill="currentColor">
                <rect x="0" y="9" width="3" height="4" rx="1"/>
                <rect x="4.5" y="6" width="3" height="7" rx="1"/>
                <rect x="9" y="3" width="3" height="10" rx="1"/>
                <rect x="13.5" y="0" width="3" height="13" rx="1" opacity="0.25"/>
              </svg>
              {/* WiFi */}
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 9.5a1 1 0 100 2 1 1 0 000-2z" fill="currentColor" stroke="none"/>
                <path d="M4.5 7.5a5 5 0 017 0M1.5 4.5a9 9 0 0113 0"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-px">
                <div
                  className={`relative rounded-[3px] border flex items-center overflow-hidden
                    ${isDark ? 'border-white/40' : 'border-gray-900/40'}`}
                  style={{ width: '25px', height: '13px', padding: '2px' }}
                >
                  <div
                    className={`rounded-[1.5px] h-full ${isDark ? 'bg-white' : 'bg-gray-900'}`}
                    style={{ width: '72%' }}
                  />
                </div>
                <div
                  className={`rounded-r-full ${isDark ? 'bg-white/40' : 'bg-gray-900/40'}`}
                  style={{ width: '2px', height: '5px' }}
                />
              </div>
            </div>
          </div>

          {/* ── Top Controls ── */}
          <div className="flex items-center justify-between px-5 pt-2 pb-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setHistoryOpen(true)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
                  ${isDark ? 'bg-white/6 text-white/50' : 'bg-black/5 text-gray-500'}`}
                style={{ backdropFilter: 'blur(10px)' }}
                title="History (H)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>
                </svg>
              </motion.button>
            </div>

            <span
              className={`text-xs font-medium tracking-widest uppercase select-none
                ${isDark ? 'text-white/20' : 'text-gray-400/60'}`}
              style={{ fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif", letterSpacing: '0.18em' }}
            >
              Sci
            </span>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              onClick={actions.toggleTheme}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
                ${isDark ? 'bg-white/6 text-white/50' : 'bg-black/5 text-gray-500'}`}
              style={{ backdropFilter: 'blur(10px)' }}
              title="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.svg key="sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </motion.svg>
                ) : (
                  <motion.svg key="moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* ── Display Area ── */}
          <div
            className={`relative mx-3 rounded-3xl overflow-hidden flex-shrink-0 mb-1
              ${isDark ? 'bg-white/[0.025]' : 'bg-black/[0.03]'}`}
            style={{
              border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
              backdropFilter: 'blur(30px)',
            }}
            onTouchStart={handleDisplayTouchStart}
            onTouchEnd={handleDisplayTouchEnd}
          >
            {/* Orange accent line */}
            <div
              className="absolute top-0 left-8 right-8 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,159,10,0.3) 50%, transparent 100%)',
              }}
            />
            <Display
              display={state.display || '0'}
              expression={state.expression}
              preview={state.preview}
              angleMode={state.angleMode}
              memoryHasValue={state.memoryHasValue}
              theme={state.theme}
              isError={state.isError}
              onSwipeDelete={actions.backspace}
              onCopy={handleCopy}
            />
          </div>

          {/* ── Backspace & Paren hint ── */}
          <div className="flex items-center justify-between px-5 mb-0.5 flex-shrink-0" style={{ minHeight: '28px' }}>
            {/* Open paren count */}
            <AnimatePresence>
              {state.openParens > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -10, scale: 0.8 }}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full
                    ${isDark ? 'text-purple-400 bg-purple-500/10' : 'text-purple-600 bg-purple-500/10'}`}
                >
                  {state.openParens} open {state.openParens === 1 ? 'paren' : 'parens'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Backspace button */}
            <AnimatePresence>
              {(state.expression || state.display !== '0') && !state.hasResult && (
                <motion.button
                  initial={{ opacity: 0, x: 12, scale: 0.7 }}
                  animate={{ opacity: 0.45, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.7 }}
                  whileHover={{ opacity: 0.9, scale: 1.1 }}
                  whileTap={{ scale: 0.82 }}
                  onClick={actions.backspace}
                  className={`ml-auto p-2 rounded-xl ${isDark ? 'text-white' : 'text-gray-700'}`}
                  title="Backspace"
                >
                  <svg width="19" height="15" viewBox="0 0 24 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 7.5 7 7.5h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                    <line x1="18" y1="8" x2="13" y2="13"/>
                    <line x1="13" y1="8" x2="18" y2="13"/>
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Scientific Panel ── */}
          <AnimatePresence mode="wait">
            {state.isScientific && (
              <div className="flex-shrink-0">
                <ScientificPanel
                  theme={state.theme}
                  angleMode={state.angleMode}
                  openParens={state.openParens}
                  onAction={handleScientificAction}
                  isInverse={isInverse}
                  onToggleInverse={() => setIsInverse(prev => !prev)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* ── Separator ── */}
          <div
            className={`mx-4 flex-shrink-0 ${isDark ? 'opacity-[0.06]' : 'opacity-[0.08]'}`}
            style={{ height: '1px', background: isDark ? 'white' : 'black' }}
          />

          {/* ── Standard Keypad ── */}
          <div className="flex-1 flex flex-col justify-end">
            <StandardKeypad
              theme={state.theme}
              isError={state.isError}
              display={state.display}
              onDigit={actions.inputDigit}
              onOperator={handleOperator}
              onEquals={() => { actions.calculate(); setActiveOp(undefined); }}
              onClear={handleClear}
              onToggleSign={actions.toggleSign}
              onPercentage={actions.percentage}
              onDecimal={actions.inputDecimal}
              activeOperator={activeOp}
            />
          </div>

          {/* ── Scientific Toggle ── */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={actions.toggleScientific}
            className={`mx-4 mb-4 flex items-center justify-center gap-2 py-2.5 rounded-2xl
              text-xs font-medium tracking-wide transition-all flex-shrink-0 select-none
              ${isDark
                ? 'bg-white/[0.035] hover:bg-white/[0.06] text-white/25 hover:text-white/50 border border-white/[0.04]'
                : 'bg-black/[0.03] hover:bg-black/[0.06] text-gray-400 hover:text-gray-600 border border-black/[0.04]'
              }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <motion.span
              animate={{ rotate: state.isScientific ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="text-[10px]"
            >
              ▲
            </motion.span>
            <span style={{ letterSpacing: '0.08em' }}>
              {state.isScientific ? 'STANDARD MODE' : 'SCIENTIFIC MODE'}
            </span>
            <motion.span
              animate={{ rotate: state.isScientific ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="text-[10px]"
            >
              ▲
            </motion.span>
          </motion.button>

          {/* ── Home Indicator ── */}
          <div className="flex justify-center pb-2 flex-shrink-0">
            <div
              className={`w-32 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-900/20'}`}
            />
          </div>

        </div>
      </motion.div>

      {/* ═══════════════════════════════ HISTORY DRAWER ══════════════════════════════ */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={state.history}
        onUseEntry={actions.useHistoryEntry}
        onClearHistory={actions.clearHistory}
        theme={state.theme}
      />

      {/* ═══════════════════════════════ KEYBOARD HINT (desktop only) ══════════════════════════════ */}
      <AnimatePresence>
        {!showSplash && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.3, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 3, duration: 0.8 }}
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-3
              text-[10px] tracking-wider uppercase
              ${isDark ? 'text-white' : 'text-gray-500'}`}
            style={{ fontFamily: "'SF Pro Display', system-ui, sans-serif" }}
          >
            {[
              { icon: '⌨', label: 'Keyboard' },
              { icon: '⌘C', label: 'Copy' },
              { icon: 'H', label: 'History' },
              { icon: '⟵', label: 'Backspace' },
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono
                    ${isDark ? 'bg-white/8 text-white/40' : 'bg-black/5 text-gray-400'}`}
                >
                  {item.icon}
                </span>
                <span className="opacity-60">{item.label}</span>
                {i < 3 && <span className="opacity-30">·</span>}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
