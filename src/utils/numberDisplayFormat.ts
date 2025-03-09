const subscriptMap: { [digit: string]: string } = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

export const formatBalance = (
  rawValue: string | number,
  mode: 'usd' | 'token',
): string => {
  let valueStr = typeof rawValue === 'number' ? rawValue.toString() : rawValue;
  let num = parseFloat(valueStr);

  if (num === 0) {
    return mode === 'usd' ? '$0.00' : '0.00';
  }

  const threshold = mode === 'usd' ? 0.01 : 0.0001;
  const prefix = mode === 'usd' ? '$' : '';

  if (num > 0 && num < threshold) {
    return mode === 'usd' ? '<$0.01' : '<0.0001';
  }

  if (valueStr.toLowerCase().includes('e')) {
    valueStr = mode === 'usd' ? num.toFixed(2) : num.toFixed(10);
    num = parseFloat(valueStr);
  }

  let [intPart, fracPart = ''] = valueStr.split('.');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (mode === 'usd') {
    fracPart = fracPart.padEnd(2, '0').slice(0, 2);
    return `${prefix}${intPart}.${fracPart}`;
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
      const remainder = fracPart.slice(zerosCount);
      const zerosSubscript = zerosCount
        .toString()
        .split('')
        .map((digit) => subscriptMap[digit] || digit)
        .join('');

      return `${intPart}.0${zerosSubscript}${remainder}`;
    } else {
      return `${intPart}.${fracPart}`;
    }
  }

  return intPart;
};

export const formatSubscript = (value: string) => {
  if (value === undefined) {
    return '';
  }

  let numericValue = parseFloat(value);

  if (numericValue === 0) {
    return '0.00';
  }

  if (value.toLowerCase().includes('e')) {
    value = numericValue.toFixed(10);
  }

  const [integerPart, fractionalPart = ''] = value.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (fractionalPart) {
    let zerosCount = 0;
    for (const char of fractionalPart) {
      if (char === '0') {
        zerosCount++;
      } else {
        break;
      }
    }

    if (zerosCount > 3) {
      const remainder = fractionalPart.slice(zerosCount);
      const zerosSubscript = zerosCount
        .toString()
        .split('')
        .map((digit) => subscriptMap[digit] || digit)
        .join('');

      return `${formattedInteger}.0${zerosSubscript}${remainder}`;
    }

    return `${formattedInteger}.${fractionalPart}`;
  }

  return formattedInteger;
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
