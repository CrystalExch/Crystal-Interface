import * as GlobalTypes from './types/index';

declare global {
  type Trade = GlobalTypes.Trade;
  interface TradesByMarket extends GlobalTypes.TradesByMarket {}
  interface TokenType extends GlobalTypes.TokenType {}
  interface Market extends GlobalTypes.Market {}
  interface Order extends GlobalTypes.Order {}
  interface DisplayOrder extends GlobalTypes.DisplayOrder {}

  const activechain: number;
  const t: (key: string) => string;
  const markets: { [key: string]: any };
  const explorer: string;
}
