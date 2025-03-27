import customRound from '../../../../utils/customRound';

export const getTradeValue = (trade: any, column: string, markets: any) => {
  const market = markets[trade[4]];
  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);

  switch (column) {
    case 'markets':
      return market.baseAsset + '-' + market.quoteAsset;
    case 'type':
      return trade[7];
    case 'oc-price':
      return trade[3] / priceFactor;
    case 'amount':
      return customRound(
        (trade[2] === 0 ? trade[0] : trade[1]) / 10 ** baseDecimals,
        3,
      );
    case 'tradeValue':
      return (trade[2] === 1 ? trade[0] : trade[1]) / 10 ** quoteDecimals;
    case 'time':
      return trade[6];
    default:
      return 0;
  }
};
