import { createConfig, fallback, http } from 'wagmi';
import { settings } from './settings.ts';

export const config = createConfig({
  chains: settings.chains,
  batch: { multicall: true },
  transports: {
    [10143]: fallback([
      http(
        'https://monad-testnet.g.alchemy.com/v2/a49PoOS9UOj8z0LjKBzl9g7I_QVyl9tW',
        { batch: true },
      ),
    ]),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
