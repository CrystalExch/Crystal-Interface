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
