export const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '-';

  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }

  if (Math.abs(num) < 0.0001) {
    return num.toExponential(4);
  }
  if (Math.abs(num) < 0.01) {
    return num.toFixed(6);
  }
  return num.toFixed(2);
};
