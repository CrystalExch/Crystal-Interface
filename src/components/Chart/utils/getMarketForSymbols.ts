export const getMarketForSymbols = (
  markets: { [key: string]: any },
  symbolIn: string,
  symbolOut: string,
) => {
  const symbolPair1 = `${symbolIn.toUpperCase()}${symbolOut.toUpperCase()}`;
  const symbolPair2 = `${symbolOut.toUpperCase()}${symbolIn.toUpperCase()}`;

  return markets[symbolPair1] || markets[symbolPair2];
};
