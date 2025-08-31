export const formatDisplay = (value: string) => {
  if (parseFloat(value) == 0) {
    return '0.00';
  }
  const [integerPart, fractionalPart] = value.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const trimmedFractional = fractionalPart
    ? fractionalPart.replace(/0+$/, '')
    : '';

  return trimmedFractional
    ? `${formattedInteger}.${trimmedFractional}`
    : formattedInteger;
};

export const formatSig = (value: string): string => {
  const addCommas = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const trimTrailingZeros = (frac: string) => frac.replace(/0+$/, '');
  const toSubscript = (n: number) =>
    String(n).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);

  const toDecimalFromExp = (s: string) => {
    const lower = s.toLowerCase();
    if (!lower.includes('e')) return s;

    let [mant, expStr] = lower.split('e');
    let sign = '';
    if (mant.startsWith('-')) { sign = '-'; mant = mant.slice(1); }
    else if (mant.startsWith('+')) { mant = mant.slice(1); }

    const exp = parseInt(expStr, 10);
    const digits = mant.replace('.', '');
    const dotPos = mant.indexOf('.') === -1 ? mant.length : mant.indexOf('.');

    if (!Number.isFinite(exp)) return s; 

    if (exp >= 0) {
      const pos = dotPos + exp;
      if (pos >= digits.length) {
        return sign + digits + '0'.repeat(pos - digits.length);
      } else {
        const intPart = digits.slice(0, pos);
        const fracPart = digits.slice(pos);
        return sign + intPart + (fracPart.length ? '.' + fracPart : '');
      }
    } else {
      const zeros = '0'.repeat(Math.max(0, -exp - 1));
      return sign + '0.' + zeros + digits;
    }
  };

  if (value === undefined || value === null) return '0.00';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  if (num === 0) return '0.00';

  const neg = num < 0;
  const signStr = neg ? '-' : '';

  let rounded = Math.abs(num).toPrecision(5);
  rounded = toDecimalFromExp(rounded);
  if (rounded.endsWith('.')) rounded = rounded.slice(0, -1);

  let [intRaw, fracRaw = ''] = rounded.split('.');
  fracRaw = trimTrailingZeros(fracRaw);

  if (!fracRaw) return signStr + addCommas(intRaw);

  if (intRaw === '0') {
    let z = 0;
    while (z < fracRaw.length && fracRaw[z] === '0') z++;
    if (z > 4) {
      const remainder = fracRaw.slice(z);
      if (!remainder) return signStr + '0';
      return `${signStr}0.0${toSubscript(z)}${remainder}`;
    }
  }

  return `${signStr}${addCommas(intRaw)}.${fracRaw}`;
};
