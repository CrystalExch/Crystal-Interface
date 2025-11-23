export interface FormattedNumber {
  type: 'simple' | 'subscript';
  text: string;
  subscriptValue?: number;
  beforeSubscript?: string;
  afterSubscript?: string;
  isNegative?: boolean;
  prefix?: string;
}

export const formatBalance = (
  rawValue: string | number,
  mode: 'usd' | 'token',
): FormattedNumber => {
  let valueStr = typeof rawValue === 'number' ? rawValue.toString() : rawValue;
  let num = parseFloat(valueStr);
  const isNegative = num < 0;
  num = Math.abs(num);
  valueStr = num.toString();
  const prefix = mode === 'usd' ? '$' : '';

  if (num === 0) {
    return { 
      type: 'simple', 
      text: mode === 'usd' ? '0.00' : '0.00',
      isNegative,
      prefix
    };
  }

  const threshold = mode === 'usd' ? 0.01 : 0.0001;

  if (num > 0 && num < threshold) {
    return { 
      type: 'simple', 
      text: mode === 'usd' ? '0.00' : '0.0001',
      isNegative,
      prefix
    };
  }

  if (valueStr.toLowerCase().includes('e')) {
    valueStr = mode === 'usd' ? num.toFixed(2) : num.toFixed(10);
    num = parseFloat(valueStr);
  }

  let [intPart, fracPart = ''] = valueStr.split('.');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (mode === 'usd') {
    fracPart = fracPart.padEnd(2, '0').slice(0, 2);
    return { 
      type: 'simple', 
      text: `${intPart}.${fracPart}`,
      isNegative,
      prefix
    };
  }

  if (fracPart) {
    let zerosCount = 0;
    for (const char of fracPart) {
      if (char === '0') {
        zerosCount++;
      } else {
        break;
      }
    }

    if (zerosCount > 3) {
      const remainder = fracPart.slice(zerosCount, zerosCount + 3);
      return {
        type: 'subscript',
        text: `${intPart}.0${remainder}`,
        subscriptValue: zerosCount,
        beforeSubscript: `${intPart}.0`,
        afterSubscript: remainder,
        isNegative,
        prefix
      };
    } else {
      return { 
        type: 'simple', 
        text: `${intPart}.${fracPart}`,
        isNegative,
        prefix
      };
    }
  }

  return { 
    type: 'simple', 
    text: intPart,
    isNegative,
    prefix
  };
};

export const formatSubscript = (value: string): FormattedNumber => {
  if (!value) {
    return { type: 'simple', text: '0.00' };
  }

  const isNegative = value.startsWith('-');
  let raw = value.replace(/^[+-]/, '').replace(/,/g, '');

  if (/[eE]/.test(raw)) {
    const [mant, expStr] = raw.toLowerCase().split('e');
    const exp = parseInt(expStr, 10);
    const digits = mant.replace('.', '');
    const dotPos = mant.indexOf('.') === -1 ? mant.length : mant.indexOf('.');
    if (exp >= 0) {
      const pos = dotPos + exp;
      raw =
        pos >= digits.length
          ? digits + '0'.repeat(pos - digits.length)
          : digits.slice(0, pos) + (pos < digits.length ? '.' + digits.slice(pos) : '');
    } else {
      raw = '0.' + '0'.repeat(-exp - 1) + digits;
    }
  }

  const [integerPart, fractionalPart = ''] = raw.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (fractionalPart) {
    let zerosCount = 0;
    for (const ch of fractionalPart) {
      if (ch === '0') zerosCount++;
      else break;
    }
    const remainder = fractionalPart.slice(zerosCount);
    
    if (zerosCount > 3 && remainder) {
      const limitedRemainder = remainder.slice(0, 1);
      return {
        type: 'subscript',
    text: `${formattedInteger}.0${limitedRemainder}`,
        subscriptValue: zerosCount,
        beforeSubscript: `${formattedInteger}.0`,
        afterSubscript: limitedRemainder,
        isNegative
      }
    }
    
    return { 
      type: 'simple', 
      text: `${formattedInteger}.${fractionalPart}`,
      isNegative
    };
  }

  return { 
    type: 'simple', 
    text: formattedInteger,
    isNegative
  };
};

export const formatCommas = (value: string) => {
  const [integerPart, fractionalPart] = value.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fractionalPart
    ? `${formattedInteger}.${fractionalPart}`
    : formattedInteger;
};

export function formatRound(num: number, decimals: number): string {
  const temp = num.toFixed(decimals);
  return formatCommas(temp);
}