export const calculateHighlightData = (
  ordersInRange: Order[],
  amountsQuote: string,
  symbol: string,
) => {
  let totalBase = 0;
  let totalQuote = 0;
  let averageCounter = 0;

  ordersInRange.forEach((order) => {
    totalBase += order.size;
    totalQuote +=
      amountsQuote === 'Quote'
        ? order.size / order.price
        : order.size * order.price;
    averageCounter += order.size * order.price;
  });

  const averagePrice = totalBase > 0 ? averageCounter / totalBase : 0;

  let displayTotalAmount: number;
  let displayUnit: string;
  let otherTotalAmount: number;
  let otherUnit: string;

  if (amountsQuote === 'Quote') {
    displayTotalAmount = totalBase;
    displayUnit = 'USDC';

    otherTotalAmount = totalQuote;
    otherUnit = symbol;
  } else {
    displayTotalAmount = totalQuote;
    displayUnit = 'USDC';

    otherTotalAmount = totalBase;
    otherUnit = symbol;
  }

  return {
    averagePrice,
    totalAmount: displayTotalAmount,
    unit: displayUnit,
    otherTotalAmount,
    otherUnit,
  };
};
