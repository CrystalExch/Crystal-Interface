export interface Market {
  quoteAsset: string;
  baseAsset: string;
  path: string[];
  quoteAddress: string;
  baseAddress: string;
  quoteDecimals: bigint;
  baseDecimals: bigint;
  address: string;
  scaleFactor: bigint;
  priceFactor: bigint;
  tickSize: bigint;
  minSize: bigint;
  maxPrice: bigint;
  fee: bigint;
  image: string;
  website: string;
}
