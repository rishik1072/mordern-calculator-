import React from 'react';
import { motion } from 'framer-motion';
import CalcButton from './CalcButton';

interface ScientificPanelProps {
  theme: 'dark' | 'light';
  angleMode: 'DEG' | 'RAD';
  openParens: number;
  onAction: (action: string, value?: string) => void;
  isInverse: boolean;
  onToggleInverse: () => void;
}

type SciBtn = {
  label: React.ReactNode;
  action: string;
  value?: string;
};

const ScientificPanel: React.FC<ScientificPanelProps> = ({
  theme,
  angleMode,
  openParens,
  onAction,
  isInverse,
  onToggleInverse,
}) => {
  const isDark = theme === 'dark';

  // Memory row
  const memRow: SciBtn[] = [
    { label: 'MC', action: 'MC' },
    { label: 'MR', action: 'MR' },
    { label: 'M+', action: 'M+' },
    { label: 'M−', action: 'M-' },
    { label: angleMode, action: 'angle' },
  ];

  // Trig row (normal / inverse)
  const trigRow: SciBtn[] = isInverse
    ? [
        { label: <span>sin<sup>-1</sup></span>, action: 'append', value: 'asin(' },
        { label: <span>cos<sup>-1</sup></span>, action: 'append', value: 'acos(' },
        { label: <span>tan<sup>-1</sup></span>, action: 'append', value: 'atan(' },
        { label: <span>e<sup>x</sup></span>, action: 'append', value: 'e^(' },
        { label: <span>10<sup>x</sup></span>, action: 'append', value: '10^(' },
      ]
    : [
        { label: 'sin', action: 'append', value: 'sin(' },
        { label: 'cos', action: 'append', value: 'cos(' },
        { label: 'tan', action: 'append', value: 'tan(' },
        { label: 'ln', action: 'append', value: 'log(' },
        { label: <span>log<sub>10</sub></span>, action: 'append', value: 'log10(' },
      ];

  // Hyperbolic / power row
  const hyperRow: SciBtn[] = isInverse
    ? [
        { label: <span>sinh<sup>-1</sup></span>, action: 'append', value: 'asinh(' },
        { label: <span>cosh<sup>-1</sup></span>, action: 'append', value: 'acosh(' },
        { label: <span>tanh<sup>-1</sup></span>, action: 'append', value: 'atanh(' },
        { label: '√x', action: 'append', value: 'sqrt(' },
        { label: '∛x', action: 'append', value: 'cbrt(' },
      ]
    : [
        { label: 'sinh', action: 'append', value: 'sinh(' },
        { label: 'cosh', action: 'append', value: 'cosh(' },
        { label: 'tanh', action: 'append', value: 'tanh(' },
        { label: <span>x<sup>2</sup></span>, action: 'append', value: '^2' },
        { label: <span>x<sup>3</sup></span>, action: 'append', value: '^3' },
      ];

  // Misc row
  const miscRow: SciBtn[] = [
    {
      label: openParens > 0
        ? <span className="relative"><span>(</span><span className="absolute -top-1 -right-2 text-[8px] text-orange-400 font-bold">{openParens}</span></span>
        : '(',
      action: 'append', value: '(',
    },
    { label: ')', action: 'append', value: ')' },
    { label: <span>x<sup>y</sup></span>, action: 'append', value: '^(' },
    { label: 'abs', action: 'append', value: 'abs(' },
    { label: 'mod', action: 'append', value: '%' },
  ];

  // Constants row
  const constRow: SciBtn[] = [
    { label: 'π', action: 'append', value: 'π' },
    { label: 'e', action: 'append', value: 'e' },
    { label: 'x!', action: 'append', value: '!' },
    { label: 'rand', action: 'random' },
    {
      label: (
        <span className={`text-[11px] font-semibold ${isInverse ? 'text-yellow-400' : ''}`}>
          {isInverse ? '2nd✓' : '2nd'}
        </span>
      ),
      action: 'inv',
    },
  ];

  const allRows = [memRow, trigRow, hyperRow, miscRow, constRow];

  function handleBtn(btn: SciBtn) {
    if (btn.action === 'inv') {
      onToggleInverse();
    } else if (btn.action === 'random') {
      onAction('random');
    } else if (btn.action === 'angle') {
      onAction('angle');
    } else if (btn.action === 'MC' || btn.action === 'MR' || btn.action === 'M+' || btn.action === 'M-') {
      onAction(btn.action);
    } else if (btn.action === 'append' && btn.value) {
      onAction('append', btn.value);
    }
  }

  function getVariant(btn: SciBtn): 'memory' | 'scientific' {
    const memActions = ['MC', 'MR', 'M+', 'M-', 'angle'];
    return memActions.includes(btn.action) ? 'memory' : 'scientific';
  }

  const ROW_HEIGHT = '54px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scaleY: 0.88 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      exit={{ opacity: 0, y: 18, scaleY: 0.88 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{ transformOrigin: 'bottom center' }}
    >
      <div
        className={`mx-3 mb-2 rounded-2xl overflow-hidden
          ${isDark ? 'border border-white/[0.035]' : 'border border-black/[0.05]'}`}
        style={{
          background: isDark
            ? 'linear-gradient(175deg, rgba(18,18,32,0.96) 0%, rgba(10,10,20,0.98) 100%)'
            : 'linear-gradient(175deg, rgba(245,245,252,0.98) 0%, rgba(240,240,250,0.99) 100%)',
          backdropFilter: 'blur(30px)',
        }}
      >
        {/* Purple accent line at top */}
        <div
          className="h-px"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.25) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.15) 50%, transparent 100%)',
          }}
        />

        {allRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid grid-cols-5 gap-2 px-2.5 py-1.5"
            style={{ height: `calc(${ROW_HEIGHT} + 12px)` }}
          >
            {row.map((btn, btnIdx) => (
              <motion.div
                key={`${rowIdx}-${btnIdx}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (rowIdx * 5 + btnIdx) * 0.01,
                  type: 'spring',
                  stiffness: 400,
                  damping: 26,
                }}
                style={{ height: ROW_HEIGHT }}
              >
                <CalcButton
                  label={btn.label}
                  onClick={() => handleBtn(btn)}
                  variant={getVariant(btn)}
                  theme={theme}
                  isActive={btn.action === 'inv' && isInverse}
                  fontSize="12px"
                />
              </motion.div>
            ))}
          </div>
        ))}

        {/* Bottom accent */}
        <div
          className="h-px"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255,159,10,0.1) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255,159,10,0.08) 50%, transparent 100%)',
          }}
        />
      </div>
    </motion.div>
  );
};

export default ScientificPanel;
