import { useState, useCallback, useEffect, useRef } from 'react';
import { evaluate, getPreviewResult, generateId, formatNumber } from '../utils/calculatorEngine';
import type { AngleMode, HistoryEntry } from '../utils/calculatorEngine';

export type Theme = 'dark' | 'light';

interface CalculatorState {
  display: string;
  expression: string;
  preview: string;
  memory: number;
  angleMode: AngleMode;
  isScientific: boolean;
  isNewEntry: boolean;
  hasResult: boolean;
  openParens: number;
  history: HistoryEntry[];
  theme: Theme;
  memoryHasValue: boolean;
  isError: boolean;
}

const INITIAL_STATE: CalculatorState = {
  display: '0',
  expression: '',
  preview: '',
  memory: 0,
  angleMode: 'DEG',
  isScientific: true,
  isNewEntry: true,
  hasResult: false,
  openParens: 0,
  history: [],
  theme: 'dark',
  memoryHasValue: false,
  isError: false,
};

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(() => {
    try {
      const saved = localStorage.getItem('calc-history');
      const savedHistory = saved ? JSON.parse(saved) : [];
      const savedTheme = (localStorage.getItem('calc-theme') as Theme) || 'dark';
      const savedAngleMode = (localStorage.getItem('calc-angleMode') as AngleMode) || 'DEG';
      return {
        ...INITIAL_STATE,
        history: savedHistory.map((h: HistoryEntry) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })),
        theme: savedTheme,
        angleMode: savedAngleMode,
      };
    } catch {
      return INITIAL_STATE;
    }
  });

  const expressionRef = useRef(state.expression);
  expressionRef.current = state.expression;

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem('calc-history', JSON.stringify(state.history.slice(0, 100)));
    } catch {}
  }, [state.history]);

  useEffect(() => {
    localStorage.setItem('calc-theme', state.theme);
  }, [state.theme]);

  useEffect(() => {
    localStorage.setItem('calc-angleMode', state.angleMode);
  }, [state.angleMode]);

  const updatePreview = useCallback((expr: string, angleMode: AngleMode) => {
    const preview = getPreviewResult(expr, angleMode);
    return preview;
  }, []);

  const appendToExpression = useCallback((value: string) => {
    setState(prev => {
      if (prev.isError) {
        // Start fresh on error
        const newExpr = value;
        return {
          ...prev,
          display: value,
          expression: newExpr,
          preview: updatePreview(newExpr, prev.angleMode),
          isNewEntry: false,
          hasResult: false,
          isError: false,
        };
      }

      let newExpr = prev.expression;
      let newDisplay = prev.display;

      if (prev.hasResult && prev.isNewEntry) {
        // After equals, start fresh for non-operator inputs
        if (!/[+\-×÷^%]/.test(value) && value !== ')') {
          newExpr = value;
          newDisplay = value;
          return {
            ...prev,
            display: newDisplay,
            expression: newExpr,
            preview: updatePreview(newExpr, prev.angleMode),
            isNewEntry: false,
            hasResult: false,
            isError: false,
          };
        } else {
          // Continue with result as base
          newExpr = prev.display + value;
        }
      } else {
        newExpr = prev.expression + value;
      }

      // Calculate open parens
      const opens = (newExpr.match(/\(/g) || []).length;
      const closes = (newExpr.match(/\)/g) || []).length;
      const openParens = Math.max(0, opens - closes);

      return {
        ...prev,
        expression: newExpr,
        display: newExpr,
        preview: updatePreview(newExpr, prev.angleMode),
        isNewEntry: false,
        hasResult: false,
        openParens,
        isError: false,
      };
    });
  }, [updatePreview]);

  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.isError) {
        return {
          ...prev,
          display: digit,
          expression: digit,
          preview: '',
          isNewEntry: false,
          hasResult: false,
          isError: false,
        };
      }

      // Start fresh after result
      if (prev.hasResult && prev.isNewEntry) {
        return {
          ...prev,
          display: digit,
          expression: digit,
          preview: '',
          isNewEntry: false,
          hasResult: false,
        };
      }

      const currentExpr = prev.expression === '0' ? digit : prev.expression + digit;
      const newExpr = prev.expression === '' || prev.expression === '0'
        ? digit
        : prev.expression + digit;

      const displayExpr = currentExpr;
      return {
        ...prev,
        display: displayExpr,
        expression: newExpr,
        preview: updatePreview(newExpr, prev.angleMode),
        isNewEntry: false,
        isError: false,
      };
    });
  }, [updatePreview]);

  const inputDecimal = useCallback(() => {
    setState(prev => {
      if (prev.isError) {
        return {
          ...prev,
          display: '0.',
          expression: '0.',
          preview: '',
          isNewEntry: false,
          hasResult: false,
          isError: false,
        };
      }

      if (prev.hasResult && prev.isNewEntry) {
        return {
          ...prev,
          display: '0.',
          expression: '0.',
          preview: '',
          isNewEntry: false,
          hasResult: false,
        };
      }

      // Check if last number segment already has decimal
      const segments = prev.expression.split(/[+\-×÷^(]/);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.includes('.')) return prev;

      const newExpr = prev.expression === '' ? '0.' : prev.expression + '.';
      return {
        ...prev,
        display: newExpr,
        expression: newExpr,
        preview: updatePreview(newExpr, prev.angleMode),
        isNewEntry: false,
        isError: false,
      };
    });
  }, [updatePreview]);

  const inputOperator = useCallback((op: string) => {
    setState(prev => {
      if (prev.isError && op !== 'clear') return prev;

      let base = prev.hasResult && prev.isNewEntry ? prev.display : prev.expression;
      if (!base || base === '') base = '0';

      // Replace trailing operator
      const opChars = /[+\-×÷]$/;
      if (opChars.test(base)) {
        base = base.slice(0, -1);
      }

      const newExpr = base + op;
      return {
        ...prev,
        expression: newExpr,
        display: newExpr,
        preview: '',
        isNewEntry: false,
        hasResult: false,
        isError: false,
      };
    });
  }, []);

  const calculate = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      const expr = prev.expression || prev.display;
      if (!expr || expr === '0') return { ...prev, hasResult: true, isNewEntry: true };

      // Auto-close open parentheses
      let finalExpr = expr;
      const opens = (finalExpr.match(/\(/g) || []).length;
      const closes = (finalExpr.match(/\)/g) || []).length;
      const missing = opens - closes;
      if (missing > 0) {
        finalExpr += ')'.repeat(missing);
      }

      const result = evaluate(finalExpr, prev.angleMode);
      const isError = result.result === 'Error' || !!result.error;

      const newHistory: HistoryEntry[] = isError
        ? prev.history
        : [
            {
              id: generateId(),
              expression: finalExpr,
              result: result.result,
              timestamp: new Date(),
            },
            ...prev.history,
          ].slice(0, 100);

      return {
        ...prev,
        display: result.result,
        expression: result.result,
        preview: '',
        history: newHistory,
        isNewEntry: true,
        hasResult: !isError,
        openParens: 0,
        isError,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: '0',
      expression: '',
      preview: '',
      isNewEntry: true,
      hasResult: false,
      openParens: 0,
      isError: false,
    }));
  }, []);

  const allClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: '0',
      expression: '',
      preview: '',
      isNewEntry: true,
      hasResult: false,
      openParens: 0,
      isError: false,
    }));
  }, []);

  const backspace = useCallback(() => {
    setState(prev => {
      if (prev.isError) {
        return { ...prev, display: '0', expression: '', isNewEntry: true, hasResult: false, isError: false };
      }
      if (prev.hasResult && prev.isNewEntry) {
        return { ...prev, display: '0', expression: '', isNewEntry: true, hasResult: false };
      }

      const newExpr = prev.expression.slice(0, -1);
      if (!newExpr) {
        return { ...prev, display: '0', expression: '', isNewEntry: true, preview: '' };
      }

      const opens = (newExpr.match(/\(/g) || []).length;
      const closes = (newExpr.match(/\)/g) || []).length;

      return {
        ...prev,
        display: newExpr,
        expression: newExpr,
        preview: updatePreview(newExpr, prev.angleMode),
        openParens: Math.max(0, opens - closes),
        isError: false,
      };
    });
  }, [updatePreview]);

  const toggleSign = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      const expr = prev.expression || '0';

      // If it's a simple number
      if (/^-?\d+\.?\d*$/.test(expr)) {
        const num = parseFloat(expr);
        const negated = formatNumber(-num);
        return {
          ...prev,
          display: negated,
          expression: negated,
          preview: '',
          hasResult: false,
          isNewEntry: false,
        };
      }

      // Wrap in negation
      const newExpr = `-(${expr})`;
      return {
        ...prev,
        display: newExpr,
        expression: newExpr,
        preview: updatePreview(newExpr, prev.angleMode),
        isNewEntry: false,
        hasResult: false,
      };
    });
  }, [updatePreview]);

  const percentage = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      const expr = prev.expression || prev.display;
      const newExpr = `(${expr})/100`;
      const result = evaluate(newExpr, prev.angleMode);
      if (result.error) return prev;
      return {
        ...prev,
        display: result.result,
        expression: result.result,
        preview: '',
        isNewEntry: true,
        hasResult: true,
      };
    });
  }, []);

  const inputScientific = useCallback((func: string) => {
    appendToExpression(func);
  }, [appendToExpression]);

  const inputConstant = useCallback((value: string) => {
    appendToExpression(value);
  }, [appendToExpression]);

  const memoryStore = useCallback(() => {
    setState(prev => {
      const val = parseFloat(prev.display);
      if (isNaN(val)) return prev;
      return { ...prev, memory: val, memoryHasValue: true };
    });
  }, []);

  const memoryRecall = useCallback(() => {
    setState(prev => {
      if (!prev.memoryHasValue) return prev;
      const memStr = formatNumber(prev.memory);
      return {
        ...prev,
        display: memStr,
        expression: prev.hasResult || prev.isNewEntry ? memStr : prev.expression + memStr,
        preview: '',
        isNewEntry: false,
        hasResult: false,
      };
    });
  }, []);

  const memoryClear = useCallback(() => {
    setState(prev => ({ ...prev, memory: 0, memoryHasValue: false }));
  }, []);

  const memoryAdd = useCallback(() => {
    setState(prev => {
      const val = parseFloat(prev.display);
      if (isNaN(val)) return prev;
      return { ...prev, memory: prev.memory + val, memoryHasValue: true };
    });
  }, []);

  const memorySubtract = useCallback(() => {
    setState(prev => {
      const val = parseFloat(prev.display);
      if (isNaN(val)) return prev;
      return { ...prev, memory: prev.memory - val, memoryHasValue: true };
    });
  }, []);

  const toggleAngleMode = useCallback(() => {
    setState(prev => {
      const newMode: AngleMode = prev.angleMode === 'DEG' ? 'RAD' : 'DEG';
      return {
        ...prev,
        angleMode: newMode,
        preview: getPreviewResult(prev.expression, newMode),
      };
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const toggleScientific = useCallback(() => {
    setState(prev => ({ ...prev, isScientific: !prev.isScientific }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
    localStorage.removeItem('calc-history');
  }, []);

  const useHistoryEntry = useCallback((entry: HistoryEntry) => {
    setState(prev => ({
      ...prev,
      display: entry.result,
      expression: entry.result,
      preview: '',
      isNewEntry: true,
      hasResult: true,
      isError: false,
    }));
  }, []);

  const pasteExpression = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setState(prev => ({
      ...prev,
      display: cleaned,
      expression: cleaned,
      preview: updatePreview(cleaned, prev.angleMode),
      isNewEntry: false,
      hasResult: false,
      isError: false,
    }));
  }, [updatePreview]);

  return {
    state,
    actions: {
      inputDigit,
      inputDecimal,
      inputOperator,
      calculate,
      clear,
      allClear,
      backspace,
      toggleSign,
      percentage,
      inputScientific,
      inputConstant,
      memoryStore,
      memoryRecall,
      memoryClear,
      memoryAdd,
      memorySubtract,
      toggleAngleMode,
      toggleTheme,
      toggleScientific,
      clearHistory,
      useHistoryEntry,
      pasteExpression,
    },
  };
}
