import { createConfig, fallback, http } from 'wagmi';
import { settings } from './settings.ts';

export const config = createConfig({
  chains: settings.chains,
  batch: { multicall: true },
  transports: {
    [10143]: fallback([
      http(
        'https://monad-testnet.g.alchemy.com/v2/SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng',
        { batch: true },
      ),
    ]),
    [143]: fallback([
      http(
        'https://monad-mainnet.g.alchemy.com/v2/SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng',
        { batch: true },
      ),
    ]),
  },
});