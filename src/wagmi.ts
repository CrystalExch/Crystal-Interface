import { createConfig, fallback, http } from 'wagmi';
import { settings } from './settings.ts';

export const config = createConfig({
  chains: settings.chains,
  batch: { multicall: true },
  transports: {
    [10143]: fallback([
      http(
        'https://testnet-rpc.monad.xyz',
        { batch: true },
      ),
    ]),
  },
});