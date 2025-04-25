import { createConfig, fallback, http } from 'wagmi';
import { settings } from './settings.ts';

export const config = createConfig({
  chains: settings.chains,
  batch: { multicall: true },
  transports: {
    [10143]: fallback([
      http(
        'https://floral-cosmopolitan-scion.monad-testnet.quiknode.pro/4c14cc05dc572fc5d138e8202f249f5f04a24fd5/',
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
