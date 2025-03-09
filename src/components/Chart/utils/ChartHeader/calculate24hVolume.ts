export const calculate24hVolume = (
  trades: any[],
  activeMarket: any,
): string => {
  const currentTime = Date.now() / 1000;
  const oneDayInSeconds = 86400;
  let volume = 0;

  const quoteDecimals = Number(activeMarket.quoteDecimals);
  trades.forEach((trade) => {
    const tradeTimestamp = trade[6];
    if (currentTime - tradeTimestamp <= oneDayInSeconds) {
      const tradeValue =
        (trade[2] === 1 ? trade[0] : trade[1]) / 10 ** quoteDecimals;
      volume += tradeValue;
    }
  });
  return volume.toFixed(2);
};
