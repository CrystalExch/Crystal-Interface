export const getOrderValue = (order: any, column: string, markets: any) => {
  const market = markets[order[4]];
  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);
  const scaleFactor = Number(market.scaleFactor);

  const amount = order[2] / 10 ** baseDecimals;
  const amountFilled = order[7] / 10 ** baseDecimals;
  const percentFilled = (amountFilled / amount) * 100;

  switch (column) {
    case 'markets':
      return market.baseAsset + '-' + market.quoteAsset;
    case 'type':
      return order[3];
    case 'limitPrice':
      return order[0] / priceFactor;
    case 'amount':
      return amount;
    case 'amountFilled':
      return percentFilled;
    case 'tradeValue':
      return order[8] / (scaleFactor * 10 ** quoteDecimals);
    case 'time':
      return order[6];
    default:
      return 0;
  }
};
