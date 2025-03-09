export const getTradeValue = (trade: any, market: any) => {
  const priceFactor = Number(market.priceFactor);
  const quoteDecimals = Number(market.quoteDecimals);

  const price = parseFloat(
    (trade[3] / priceFactor || 0).toFixed(Math.log10(priceFactor)),
  );

  const tradeValue =
    (trade[2] === 1 ? trade[0] : trade[1]) / 10 ** quoteDecimals;

  return {
    price,
    tradeValue,
  };
};
