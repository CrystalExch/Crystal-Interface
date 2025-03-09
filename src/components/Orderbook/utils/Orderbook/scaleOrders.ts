interface Order {
  price: number;
  size: number;
  totalSize: number;
  changeType?: boolean;
  isPhantom?: boolean;
  shouldFlash: boolean;
}

const SPREAD_DISPLAY_HEIGHT = 50;
const HEADER_HEIGHT = 20;
const MIN_ORDERS = 0;

export function scaleOrders(
  orders: Order[],
  interval: number,
  isBuyOrder: boolean,
  viewMode: string,
  containerHeight: number,
  rowHeight: number,
): { orders: Order[]; leftoverPerRow: number } {
  if (!orders || !Array.isArray(orders)) {
    return { orders: [], leftoverPerRow: 0 };
  }

  const groupedOrders = groupOrders(orders, interval, isBuyOrder);
  const adjustedHeight = Math.max(
    containerHeight - HEADER_HEIGHT - SPREAD_DISPLAY_HEIGHT / 2,
    100,
  );

  let limit = Math.floor(adjustedHeight / rowHeight);

  if (viewMode === 'both') {
    limit = Math.floor(limit / 2);
  }

  limit = Math.max(MIN_ORDERS, limit);

  let slicedOrders = groupedOrders.slice(0, limit);

  const usedHeight = slicedOrders.length * rowHeight;
  const remainingHeight = adjustedHeight - usedHeight;
  const maxPhantomOrders = Math.floor(remainingHeight / rowHeight);

  if (slicedOrders.length < limit && maxPhantomOrders > 0) {
    const numberOfPhantomOrders = Math.min(
      limit - slicedOrders.length,
      maxPhantomOrders,
    );
    const phantomOrders = Array.from({ length: numberOfPhantomOrders }, () => ({
      price: 0,
      size: 0,
      totalSize: 0,
      isPhantom: true,
      shouldFlash: false,
    }));
    slicedOrders = [...slicedOrders, ...phantomOrders];
  }

  const amount =
    viewMode === 'both' ? slicedOrders.length * 2 : slicedOrders.length;
  const leftover = adjustedHeight - amount * rowHeight;
  const leftoverPerRow = amount > 0 ? Math.max(0, leftover) / amount : 0;

  return {
    orders: slicedOrders,
    leftoverPerRow,
  };
}

const groupOrders = (
  orders: Order[],
  interval: number,
  isBuy: boolean,
): Order[] => {
  const grouped: {
    [priceLevel: number]: { size: number; shouldFlash: boolean };
  } = {};

  const preciseRound = (value: number, decimals: number): number => {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  };

  const epsilon = 1e-8;

  orders.forEach(({ price, size, shouldFlash }) => {
    const intervalStart = isBuy
      ? Math.floor((price + epsilon) / interval) * interval
      : Math.ceil((price - epsilon) / interval) * interval;

    const roundedInterval = preciseRound(intervalStart, 8);

    if (!grouped[roundedInterval]) {
      grouped[roundedInterval] = { size: 0, shouldFlash: false };
    }

    grouped[roundedInterval].size = preciseRound(
      grouped[roundedInterval].size + size,
      8,
    );

    if (shouldFlash) {
      grouped[roundedInterval].shouldFlash = true;
    }
  });

  return Object.entries(grouped)
    .map(([price, { size, shouldFlash }]) => ({
      price: preciseRound(Number(price), 8),
      size: preciseRound(size, 8),
      totalSize: 0,
      shouldFlash,
    }))
    .sort((a, b) => (isBuy ? b.price - a.price : a.price - b.price))
    .reduce((acc, order) => {
      const prevTotal = acc.length > 0 ? acc[acc.length - 1].totalSize : 0;
      const totalSize = preciseRound(prevTotal + order.size, 8);
      acc.push({ ...order, totalSize });
      return acc;
    }, [] as Order[]);
};
