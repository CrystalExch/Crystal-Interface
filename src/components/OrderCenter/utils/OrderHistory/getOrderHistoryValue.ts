import { settings } from "../../../../settings";

export const getOrderHistoryValue = (
  order: any,
  column: string,
  markets: any,
  trades: any,
) => {
  const market = markets[order[4]];
  const priceFactor = Number(market.priceFactor);
  const baseDecimals = Number(market.baseDecimals);
  const quoteDecimals = Number(market.quoteDecimals);
  const scaleFactor = Number(market.scaleFactor);

  const amount = order[2] / 10 ** baseDecimals;
  const amountFilled = order[7] / 10 ** baseDecimals;
  const percentFilled = (amountFilled / amount) * 100;
  const quotePrice = market.quoteAsset == 'USDC' ? 1 : trades[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
  / Number(markets[(market.quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : market.quoteAsset) + 'USDC']?.priceFactor)

  switch (column) {
    case 'markets':
      return market.baseAsset + '-' + market.quoteAsset;
    case 'type':
      return order[3];
    case 'price':
      return order[0] / priceFactor;
    case 'amount':
      return amount;
    case 'amountFilled':
      return percentFilled;
    case 'tradeValue':
      return order[8] * quotePrice / (scaleFactor * 10 ** quoteDecimals);
    case 'status':
      return order[9];
    case 'time':
      return order[6];
    default:
      return 0;
  }
};
