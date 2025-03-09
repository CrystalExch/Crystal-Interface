export type Trade = [
  tradeSize: number,
  tradePrice: number,
  side: number,
  blockNumber: number,
  marketKey: string,
  transactionHash: string,
  timestamp: number,
];

export interface TradesByMarket {
  [marketKey: string]: Trade[];
}
