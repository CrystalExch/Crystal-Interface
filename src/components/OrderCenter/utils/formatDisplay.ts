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

  if (value === undefined || value === null) return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num === 0) return value;

  const neg = num < 0;
  const signStr = neg ? '-' : '';

  const sigFigs = (s: string) => (s.includes('e')||s.includes('E')?Number(s).toString():s).replace(/^-?0*\.?0*/, '').replace('.', '').length;
  let rounded = sigFigs(value) <= 5 ? value.replace('-', '') : Math.abs(num).toPrecision(5);

  const toDecimalFromExp = (s: string) => {
    if (!/[eE]/.test(s)) return s;
    const [mant, expStr] = s.toLowerCase().split('e');
    const exp = parseInt(expStr, 10);
    const digits = mant.replace('.', '');
    const dotPos = mant.indexOf('.') === -1 ? mant.length : mant.indexOf('.');
    if (exp >= 0) {
      const pos = dotPos + exp;
      return pos >= digits.length
        ? digits + '0'.repeat(pos - digits.length)
        : digits.slice(0, pos) + (pos < digits.length ? '.' + digits.slice(pos) : '');
    } else {
      return '0.' + '0'.repeat(-exp - 1) + digits;
    }
  };

  rounded = toDecimalFromExp(rounded);

  let [intRaw, fracRaw = ''] = rounded.split('.');

  return fracRaw ? `${signStr}${addCommas(intRaw)}.${fracRaw}` : signStr + addCommas(intRaw);
};