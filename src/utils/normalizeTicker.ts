import { settings } from '../config';

export default function normalizeTicker(ticker: string, chain: number) {
  return ticker === settings.chainConfig[chain].ethname
    ? settings.chainConfig[chain].wethname
    : ticker;
}
