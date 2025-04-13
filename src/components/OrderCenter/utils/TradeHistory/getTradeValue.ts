import { settings } from "../../../../settings";

export const getTradeValue = (trade: any, column: string, markets: any, trades: any) => {
  const market = markets[trade[4]];
  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);
  const quotePrice = market.quoteAsset == 'USDC' ? 1 : trades[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
  / Number(markets[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.priceFactor)

  switch (column) {
    case 'markets':
      return market.baseAsset + '-' + market.quoteAsset;
    case 'type':
      return trade[7];
    case 'oc-price':
      return trade[3] / priceFactor;
    case 'amount':
      return (trade[2] === 0 ? trade[0] : trade[1]) / 10 ** baseDecimals;
    case 'tradeValue':
      return (trade[2] === 1 ? trade[0] : trade[1]) * quotePrice / 10 ** quoteDecimals;
    case 'time':
      return trade[6];
    default:
      return 0;
  }
};
