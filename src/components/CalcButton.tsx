import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'digit' | 'operator' | 'function' | 'equals' | 'memory' | 'scientific';

interface CalcButtonProps {
  label: React.ReactNode;
  sublabel?: string;
  onClick: () => void;
  variant: ButtonVariant;
  theme: 'dark' | 'light';
  isActive?: boolean;
  isWide?: boolean;
  disabled?: boolean;
  fontSize?: string;
}

// iPhone-accurate button colors
const COLORS: Record<ButtonVariant, { dark: React.CSSProperties; light: React.CSSProperties; activeDark?: React.CSSProperties; activeLight?: React.CSSProperties }> = {
  digit: {
    dark: {
      background: '#333333',
      color: '#FFFFFF',
      boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
    },
    light: {
      background: '#FFFFFF',
      color: '#000000',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
    },
  },
  operator: {
    dark: {
      background: '#FF9F0A',
      color: '#FFFFFF',
      boxShadow: '0 6px 24px rgba(255,159,10,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
    },
    light: {
      background: '#FF9F0A',
      color: '#FFFFFF',
      boxShadow: '0 6px 20px rgba(255,159,10,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
    },
    activeDark: {
      background: '#FFFFFF',
      color: '#FF9F0A',
      boxShadow: '0 6px 24px rgba(255,255,255,0.22), inset 0 1px 0 rgba(255,159,10,0.2)',
    },
    activeLight: {
      background: '#FFFFFF',
      color: '#FF9F0A',
      boxShadow: '0 4px 16px rgba(255,255,255,0.4)',
    },
  },
  function: {
    dark: {
      background: '#A5A5A5',
      color: '#000000',
      boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.28)',
    },
    light: {
      background: '#D4D4D2',
      color: '#000000',
      boxShadow: '0 3px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
    },
  },
  equals: {
    dark: {
      background: '#FF9F0A',
      color: '#FFFFFF',
      boxShadow: '0 6px 28px rgba(255,159,10,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
    },
    light: {
      background: '#FF9F0A',
      color: '#FFFFFF',
      boxShadow: '0 6px 24px rgba(255,159,10,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
    },
  },
  memory: {
    dark: {
      background: 'rgba(28,28,36,0.85)',
      color: '#FF9F0A',
      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,159,10,0.18)',
    } as React.CSSProperties,
    light: {
      background: 'rgba(255,255,255,0.9)',
      color: '#E08800',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid rgba(255,159,10,0.2)',
    } as React.CSSProperties,
  },
  scientific: {
    dark: {
      background: 'rgba(22,22,38,0.9)',
      color: '#C4B5FD',
      boxShadow: '0 2px 12px rgba(0,0,0,0.45)',
      border: '1px solid rgba(109,40,217,0.18)',
    } as React.CSSProperties,
    light: {
      background: 'rgba(237,233,254,0.95)',
      color: '#5B21B6',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      border: '1px solid rgba(109,40,217,0.15)',
    } as React.CSSProperties,
  },
};

const DEFAULT_FONT_SIZES: Record<ButtonVariant, string> = {
  digit: '32px',
  operator: '32px',
  equals: '36px',
  function: '22px',
  memory: '13px',
  scientific: '13px',
};

const CalcButton: React.FC<CalcButtonProps> = ({
  label,
  sublabel,
  onClick,
  variant,
  theme,
  isActive = false,
  isWide = false,
  disabled = false,
  fontSize,
}) => {
  const isDark = theme === 'dark';
  const colors = COLORS[variant];
  const rippleContainerRef = useRef<HTMLDivElement>(null);

  let styleObj: React.CSSProperties = isDark ? { ...colors.dark } : { ...colors.light };
  if (isActive && variant === 'operator') {
    styleObj = isDark
      ? { ...colors.activeDark! }
      : { ...colors.activeLight! };
  }

  const fSize = fontSize || DEFAULT_FONT_SIZES[variant];

  const spawnRipple = useCallback((clientX: number, clientY: number) => {
    const el = rippleContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    const rippleColor = variant === 'operator' || variant === 'equals'
      ? 'rgba(255,255,255,0.2)'
      : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

    ripple.style.cssText = `
      position:absolute;
      width:${size}px;
      height:${size}px;
      left:${x}px;
      top:${y}px;
      border-radius:50%;
      background:${rippleColor};
      pointer-events:none;
      animation:rippleEffect 0.55s ease-out forwards;
      z-index:5;
    `;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 560);
  }, [variant, isDark]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    spawnRipple(e.clientX, e.clientY);
    onClick();
  }, [disabled, onClick, spawnRipple]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className="relative overflow-hidden select-none cursor-pointer w-full h-full"
      style={{
        borderRadius: '50%',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        willChange: 'transform',
        fontFamily: "'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif",
        ...styleObj,
        ...(disabled ? { opacity: 0.4 } : {}),
        transition: 'background-color 0.12s ease, color 0.12s ease',
      }}
      whileTap={{
        scale: isWide ? 0.92 : 0.88,
        transition: { type: 'spring', stiffness: 700, damping: 22, mass: 0.4 },
      }}
      whileHover={!disabled ? {
        scale: 1.04,
        transition: { type: 'spring', stiffness: 450, damping: 18 },
      } : {}}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      {/* Ripple container */}
      <div ref={rippleContainerRef} className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" />

      {/* Top gloss highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '50%',
          background: 'linear-gradient(170deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 55%)',
        }}
      />

      {/* Bottom ambient reflection */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-0.5">
        <span
          className="leading-none font-light select-none"
          style={{ fontSize: fSize }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="leading-none select-none"
            style={{ fontSize: '9px', opacity: 0.55, fontWeight: 400 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default CalcButton;
