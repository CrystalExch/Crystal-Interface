
export interface FormattedNumber {
  type: 'simple' | 'subscript';
  text: string;
  subscriptValue?: number;
  beforeSubscript?: string;
  afterSubscript?: string;
}

export const formatSubscript = (value: string): FormattedNumber => {
  if (value === undefined) {
    return { type: 'simple', text: '0.00' };
  }

  let numericValue = parseFloat(value);

  if (numericValue === 0) {
    return { type: 'simple', text: '0.00' };
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
  const remainder = fractionalPart.slice(zerosCount, zerosCount + 1);
  return {
    type: 'subscript',
    text: `${formattedInteger}.0${remainder}`,
    subscriptValue: zerosCount,
    beforeSubscript: `${formattedInteger}.0`,
    afterSubscript: remainder,
  };
}
    return { type: 'simple', text: `${formattedInteger}.${fractionalPart}` };
  }

  return { type: 'simple', text: formattedInteger };
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