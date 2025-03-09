export interface TokenType {
  ticker: string;
  name: string;
  address: string;
  decimals: bigint;
  image: string;
  exchange?: string;
}
