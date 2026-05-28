import { create, all } from 'mathjs';

const math = create(all, {
  number: 'number',
  precision: 14,
});

export type AngleMode = 'DEG' | 'RAD';

export interface CalculationResult {
  result: string;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

// Preprocess expression for mathjs
function preprocessExpression(expr: string, angleMode: AngleMode): string {
  let p = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/∞/g, 'Infinity')
    .replace(/Infinity/g, '1e309');

  // Handle factorial symbols before functions
  p = p.replace(/(\d+(?:\.\d+)?)!/g, (_match, n) => {
    const num = parseFloat(n);
    if (!Number.isInteger(num) || num < 0) return 'NaN';
    if (num > 170) return '1e309';
    let res = 1;
    for (let i = 2; i <= num; i++) res *= i;
    return String(res);
  });

  // Handle degree-mode trig
  if (angleMode === 'DEG') {
    // Inverse trig → result in degrees
    p = p
      .replace(/\basin\(/g, '((180/pi)*asin(')
      .replace(/\bacos\(/g, '((180/pi)*acos(')
      .replace(/\batan\(/g, '((180/pi)*atan(')
      .replace(/\basinh\(/g, 'asinh(')
      .replace(/\bacosh\(/g, 'acosh(')
      .replace(/\batanh\(/g, 'atanh(');

    // Forward trig → input in degrees
    p = p
      .replace(/\bsin\(/g, 'sin((pi/180)*(')
      .replace(/\bcos\(/g, 'cos((pi/180)*(')
      .replace(/\btan\(/g, 'tan((pi/180)*(')
      .replace(/\bsinh\(/g, 'sinh(')
      .replace(/\bcosh\(/g, 'cosh(')
      .replace(/\btanh\(/g, 'tanh(')
      .replace(/\bcot\(/g, '(1/tan((pi/180)*(')
      .replace(/\bsec\(/g, '(1/cos((pi/180)*(')
      .replace(/\bcsc\(/g, '(1/sin((pi/180)*(');
  } else {
    p = p
      .replace(/\bcot\(/g, '(1/tan(')
      .replace(/\bsec\(/g, '(1/cos(')
      .replace(/\bcsc\(/g, '(1/sin(');
  }

  // log10 -> log(..., 10)  and  log( -> log(
  p = p.replace(/\blog10\(/g, 'log10(');

  return p;
}

// Auto-balance parentheses
function balanceParens(expr: string): string {
  const opens = (expr.match(/\(/g) || []).length;
  const closes = (expr.match(/\)/g) || []).length;
  const diff = opens - closes;
  if (diff > 0) return expr + ')'.repeat(diff);
  return expr;
}

export function evaluate(expression: string, angleMode: AngleMode): CalculationResult {
  if (!expression || expression.trim() === '' || expression === '0') {
    return { result: '0' };
  }

  try {
    const balanced = balanceParens(expression);
    const processed = preprocessExpression(balanced, angleMode);
    const result = math.evaluate(processed);

    if (result === undefined || result === null) {
      return { result: '0' };
    }

    // Complex number handling
    if (result && typeof result === 'object' && 'im' in result && result.im !== 0) {
      return { result: 'Complex', error: 'Complex number' };
    }

    const numResult = typeof result === 'number' ? result : Number(result);

    if (isNaN(numResult)) {
      return { result: 'Error', error: 'Not a number' };
    }

    if (!isFinite(numResult)) {
      return { result: numResult > 0 ? '∞' : '-∞' };
    }

    return { result: formatNumber(numResult) };
  } catch (err) {
    const msg = String(err);
    if (msg.includes('divide') || msg.includes('Division')) {
      return { result: '∞', error: 'Division by zero' };
    }
    return { result: 'Error', error: msg };
  }
}

export function formatNumber(num: number): string {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return num > 0 ? '∞' : '-∞';

  const abs = Math.abs(num);

  // Scientific notation for very large or very small
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) {
    const str = num.toExponential(8);
    // Remove trailing zeros in mantissa
    return str.replace(/(\.\d*?)0+(e)/, '$1$2').replace(/\.(e)/, '$1');
  }

  // Normal precision
  const rounded = parseFloat(num.toPrecision(12));
  const str = rounded.toString();

  // Remove trailing zeros after decimal
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }

  return str;
}

export function getPreviewResult(expression: string, angleMode: AngleMode): string {
  if (!expression || expression === '0' || expression === '') return '';

  const lastChar = expression.trim().slice(-1);
  if (['+', '-', '×', '÷', '(', '^', '*', '/', ','].includes(lastChar)) return '';

  try {
    const result = evaluate(expression, angleMode);
    if (result.error) return '';
    if (result.result === expression.replace(/−/g, '-')) return '';
    if (result.result === 'Error') return '';
    return result.result;
  } catch {
    return '';
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
