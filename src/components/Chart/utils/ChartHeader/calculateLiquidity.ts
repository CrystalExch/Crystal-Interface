import customRound from '../../../../utils/customRound';

export const calculateLiquidity = (
  buyOrders: any[],
  sellOrders: any[],
  unpackOrderData: (orders: any[], market: any) => any[],
  activeMarket: any,
): { buyLiquidity: string; sellLiquidity: string } => {
  if (!activeMarket) {
    return { buyLiquidity: '0', sellLiquidity: '0' };
  }

  const unpackedBuyOrders = unpackOrderData(buyOrders, activeMarket);
  const unpackedSellOrders = unpackOrderData(sellOrders, activeMarket);

  let totalBuyLiquidity = 0;
  let totalSellLiquidity = 0;

  for (const order of unpackedBuyOrders) {
    totalBuyLiquidity += order.size;
  }

  for (const order of unpackedSellOrders) {
    totalSellLiquidity += order.size;
  }

  return {
    buyLiquidity: customRound(totalBuyLiquidity, 2),
    sellLiquidity: customRound(totalSellLiquidity, 2),
  };
};
