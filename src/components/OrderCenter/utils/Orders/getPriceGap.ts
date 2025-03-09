import { formatSubscript } from '../../../../utils/numberDisplayFormat';

export interface PriceGapResult {
  formattedGap: string;
  gapColor: string;
}

export function getPriceGap(
  triggerPrice: number,
  currentPrice: number,
  priceFactor: number,
): PriceGapResult {
  if (currentPrice === 0) {
    return { formattedGap: 'N/A', gapColor: 'grey' };
  }

  const priceGap = triggerPrice - currentPrice;
  const gapPercentage = (priceGap / currentPrice) * 100;

  const isPositiveGap = priceGap >= 0;
  const gapColor = isPositiveGap ? '#65ed92' : 'rgb(240, 103, 103)';
  const gapSign = isPositiveGap ? '+' : '';

  const formattedPriceGap = `${gapSign}${priceGap.toFixed(Math.log10(Number(priceFactor)))}`;
  const formattedGapPercentage = `${gapSign}${gapPercentage.toFixed(2)}%`;

  const formattedGap = `${formatSubscript(formattedPriceGap)} / ${formattedGapPercentage}`;

  return { formattedGap, gapColor };
}
