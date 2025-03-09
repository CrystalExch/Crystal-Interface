export interface TradesByMarket {
  [key: string]: any;
}

export interface TokenType {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  baseAddress?: string;
  quoteAddress?: string;
  baseAsset?: string;
  quoteAsset?: string;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TokenBalances {
  [key: string]: string | number;
}
