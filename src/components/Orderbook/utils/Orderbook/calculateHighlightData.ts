export const calculateHighlightData = (
  ordersInRange: Order[],
  amountsQuote: string,
  symbolQuote: string,
  symbolBase: string,
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
  let otherTotalAmount: number;

  if (amountsQuote === 'Quote') {
    displayTotalAmount = totalBase;
    otherTotalAmount = totalQuote;
  } else {
    displayTotalAmount = totalQuote;
    otherTotalAmount = totalBase;
  }

  return {
    averagePrice,
    totalAmount: displayTotalAmount,
    unit: symbolQuote,
    otherTotalAmount,
    otherUnit: symbolBase,
  };
};
