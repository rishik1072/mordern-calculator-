import React from 'react';
import { motion } from 'framer-motion';
import CalcButton from './CalcButton';

interface StandardKeypadProps {
  theme: 'dark' | 'light';
  isError: boolean;
  display: string;
  onDigit: (d: string) => void;
  onOperator: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onPercentage: () => void;
  onDecimal: () => void;
  activeOperator?: string;
}

const StandardKeypad: React.FC<StandardKeypadProps> = ({
  theme,
  isError,
  display,
  onDigit,
  onOperator,
  onEquals,
  onClear,
  onToggleSign,
  onPercentage,
  onDecimal,
  activeOperator,
}) => {
  const isAC = !display || display === '0' || isError;

  // Each row as defined buttons
  const rows: Array<Array<{ label: string; variant: 'digit' | 'operator' | 'function' | 'equals'; action: () => void; isActive?: boolean; }>> = [
    [
      { label: isAC ? 'AC' : 'C', variant: 'function', action: onClear },
      { label: '+/−', variant: 'function', action: onToggleSign },
      { label: '%', variant: 'function', action: onPercentage },
      { label: '÷', variant: 'operator', action: () => onOperator('÷'), isActive: activeOperator === '÷' },
    ],
    [
      { label: '7', variant: 'digit', action: () => onDigit('7') },
      { label: '8', variant: 'digit', action: () => onDigit('8') },
      { label: '9', variant: 'digit', action: () => onDigit('9') },
      { label: '×', variant: 'operator', action: () => onOperator('×'), isActive: activeOperator === '×' },
    ],
    [
      { label: '4', variant: 'digit', action: () => onDigit('4') },
      { label: '5', variant: 'digit', action: () => onDigit('5') },
      { label: '6', variant: 'digit', action: () => onDigit('6') },
      { label: '−', variant: 'operator', action: () => onOperator('−'), isActive: activeOperator === '−' },
    ],
    [
      { label: '1', variant: 'digit', action: () => onDigit('1') },
      { label: '2', variant: 'digit', action: () => onDigit('2') },
      { label: '3', variant: 'digit', action: () => onDigit('3') },
      { label: '+', variant: 'operator', action: () => onOperator('+'), isActive: activeOperator === '+' },
    ],
  ];

  let animCounter = 0;

  return (
    <div className="px-4 pt-1 pb-1 flex flex-col gap-3">
      {/* Rows 1-4 (4 buttons each) */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-3" style={{ height: '72px' }}>
          {row.map((btn, bi) => {
            const delay = animCounter++ * 0.013;
            return (
              <motion.div
                key={bi}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay, type: 'spring', stiffness: 380, damping: 26 }}
                className="h-full"
              >
                <CalcButton
                  label={btn.label}
                  onClick={btn.action}
                  variant={btn.variant}
                  theme={theme}
                  isActive={btn.isActive || false}
                />
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Row 5: 0 (wide) + . + = */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', height: '72px' }}>
        {/* Zero — spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animCounter++ * 0.013, type: 'spring', stiffness: 380, damping: 26 }}
          className="col-span-2 h-full"
          style={{ borderRadius: '36px', overflow: 'hidden' }}
        >
          {/* Wide zero button — pill shaped */}
          <WideZeroButton theme={theme} onClick={() => onDigit('0')} />
        </motion.div>

        {/* Dot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animCounter++ * 0.013, type: 'spring', stiffness: 380, damping: 26 }}
          className="h-full"
        >
          <CalcButton
            label="."
            onClick={onDecimal}
            variant="digit"
            theme={theme}
          />
        </motion.div>

        {/* Equals */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: animCounter++ * 0.013, type: 'spring', stiffness: 380, damping: 26 }}
          className="h-full"
        >
          <CalcButton
            label="="
            onClick={onEquals}
            variant="equals"
            theme={theme}
          />
        </motion.div>
      </div>
    </div>
  );
};

// Wide "0" button - pill shaped like real iPhone
interface WideZeroProps {
  theme: 'dark' | 'light';
  onClick: () => void;
}

const WideZeroButton: React.FC<WideZeroProps> = ({ theme, onClick }) => {
  const isDark = theme === 'dark';
  const rippleRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (rippleRef.current) {
      const rect = rippleRef.current.getBoundingClientRect();
      const size = rect.height * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        left:${x}px;
        top:${y}px;
        border-radius:50%;
        background:${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
        pointer-events:none;
        animation:rippleEffect 0.55s ease-out forwards;
        z-index:5;
      `;
      rippleRef.current.appendChild(ripple);
      setTimeout(() => ripple.remove(), 560);
    }
    onClick();
  };

  return (
    <motion.button
      ref={rippleRef}
      onClick={handleClick}
      className="relative w-full h-full overflow-hidden flex items-center select-none"
      style={{
        borderRadius: '36px',
        background: isDark ? '#333333' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#000000',
        boxShadow: isDark
          ? '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
          : '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        willChange: 'transform',
        fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
        paddingLeft: '28px',
      }}
      whileTap={{
        scale: 0.93,
        transition: { type: 'spring', stiffness: 700, damping: 22, mass: 0.4 },
      }}
      whileHover={{
        scale: 1.02,
        transition: { type: 'spring', stiffness: 450, damping: 18 },
      }}
    >
      {/* Gloss */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '36px',
          background: 'linear-gradient(170deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 55%)',
        }}
      />
      <span
        className="relative z-10 leading-none font-light select-none"
        style={{ fontSize: '32px' }}
      >
        0
      </span>
    </motion.button>
  );
};

export default StandardKeypad;
