export const unpackOrderData = (
  orderData: bigint[],
  market: any,
): { price: number; size: number }[] =>
  orderData.map((order) => ({
    price:
      Number(order >> BigInt(128)) /
      Number(market.scaleFactor * BigInt(10) ** market.quoteDecimals),
    size: parseFloat(
      (
        Number(order & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')) /
        Number(market.scaleFactor * BigInt(10) ** market.quoteDecimals)
      ).toFixed(2),
    ),
  }));
