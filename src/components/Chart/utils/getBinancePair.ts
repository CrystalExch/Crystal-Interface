export const getBinancePair = (symbolIn: string, symbolOut: string): string => {
  const tokenIn = symbolIn.toUpperCase();
  const tokenOut = symbolOut.toUpperCase();

  if (tokenIn === 'USDC' || tokenIn === 'USDT') {
    return tokenOut + 'USDT';
  } else if (tokenOut === 'USDC' || tokenOut === 'USDT') {
    return tokenIn + 'USDT';
  } else {
    return tokenIn + tokenOut;
  }
};
