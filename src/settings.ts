import iconmonad from './assets/iconmonad.png';
import iconsol from './assets/iconsol.png';
import iconusdc from './assets/iconusdc.png';
import iconusdt from './assets/iconusdt.png';
import iconwbtc from './assets/iconwbtc.png';
import iconweth from './assets/iconweth.png';
import iconwmonad from './assets/iconwmonad.png';
import iconshmon from './assets/iconshmon.png';
import icondak from './assets/icondak.png';
import iconchog from './assets/iconchog.png';
import iconsmon from './assets/iconsmon.png';
import iconyaki from './assets/iconyaki.png';
import iconaprmon from './assets/iconaprmon.png';
import MonadLogo from './assets/monad.svg';

export const settings: any = {
  useAdv: true,
  graphKey: '976ed95a54cf8e4abcbdd954605a3a6e',
  perpsEndpoint: window.location.hostname == 'localhost' ? '' : 'https://pro.edgex.exchange',
  chains: [
    {
      id: 143,
      name: 'Monad',
      nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
      rpcUrls: {
        default: {
          http: [
            'https://rpc.monad.xyz',
          ],
        },
        alchemy: {
          http: [
            'https://monad-mainnet.g.alchemy.com/v2',
          ],
        },
      },
      blockExplorers: {
        default: {
          name: 'MonadScan',
          url: 'https://monadscan.com',
        },
      },
      contracts: {
        multicall3: {
          address: '0xcA11bde05977b3631167028862bE2a173976CA11',
          blockCreated: 0,
        },
      },
    },
  ],
  chainConfig: {
    143: {
      name: 'Monad',
      httpurl:
        'https://rpc.monad.xyz',
      wssurl: `wss://rpc-mainnet.monadinfra.com`,
      eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      weth: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
      usdc: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
      balancegetter:
        '0x10D52311a48bAE11Cf355b8a0e260F757ef5C9DB' as `0x${string}`,
      router: '0xed8FeB0b185bf7842F46Ed0Ee4DBD0A13F68E3C7' as `0x${string}`,
      referralManager: '0x10D52311a48bAE11Cf355b8a0e260F757ef5C9DB' as `0x${string}`,
      launchpadRouter: '0xed8FeB0b185bf7842F46Ed0Ee4DBD0A13F68E3C7' as `0x${string}`,
      crystalVaults: "0x9FbbC911E84b78cb40439DF7d7065Eb1b68b527D" as `0x${string}`,
      multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
      firstblock: 0,
      ethticker: 'MON',
      wethticker: 'WMON',
      explorer: 'https://monadscan.com',
      image: MonadLogo,
      blocktime: 0.4,
      gasamount: BigInt(13000000000000000000),
      RPC_URLS: [...new Set([
        'https://rpc.monad.xyz/',
        'https://rpc1.monad.xyz/',
        'https://rpc2.monad.xyz/',
        'https://rpc3.monad.xyz/',
        'https://rpc-mainnet.monadinfra.com/',
        'https://monad-mainnet.g.alchemy.com/v2/SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng',
        'https://quick-damp-scion.monad-mainnet.quiknode.pro/7fa5b2fae4c0c8c78b6c8abb7d70c76962389eba',
      ])],
      markets: {
        MONUSDC: {
          quoteAsset: 'USDC',
          baseAsset: 'MON',
          path: [
            '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          ],
          quoteAddress: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          baseAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          quoteDecimals: BigInt(6),
          baseDecimals: BigInt(18),
          address: '0xA4dCef430fc8056713e6865fe64b6150e541Ef23'.toLowerCase(),
          marketType: 2,
          precision: 5,
          scaleFactor: BigInt(10 ** 21),
          priceFactor: BigInt(1000000000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(1000000000000000),
          fee: BigInt(99970),
          makerRebate: BigInt(99990),
          image: iconmonad,
          website: 'https://www.monad.xyz/',
        },
        WMONUSDC: {
          quoteAsset: 'USDC',
          baseAsset: 'WMON',
          path: [
            '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
            '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
          ],
          quoteAddress: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          baseAddress: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
          quoteDecimals: BigInt(6),
          baseDecimals: BigInt(18),
          address: '0xA4dCef430fc8056713e6865fe64b6150e541Ef23'.toLowerCase(),
          marketType: 2,
          precision: 5,
          scaleFactor: BigInt(10 ** 21),
          priceFactor: BigInt(1000000000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(1000000000000000),
          fee: BigInt(99970),
          makerRebate: BigInt(99990),
          image: iconwmonad,
          website: 'https://www.monad.xyz/',
        },
      },
      addresstomarket: Object.fromEntries([
        ['0xA4dCef430fc8056713e6865fe64b6150e541Ef23', 'MONUSDC'],
      ].map(([key, value]) => [key.toLowerCase(), value])),
      tokendict: {
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': {
          ticker: 'MON',
          name: 'Monad',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          decimals: BigInt(18),
          image: iconmonad,
          website: 'https://www.monad.xyz/',
        },
        '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A': {
          ticker: 'WMON',
          name: 'Wrapped Monad',
          address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
          decimals: BigInt(18),
          image: iconwmonad,
          website: 'https://www.monad.xyz/',
        },
        '0x754704Bc059F8C67012fEd69BC8A327a5aafb603': {
          ticker: 'USDC',
          name: 'USD Coin',
          address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          decimals: BigInt(6),
          image: iconusdc,
        },
      },
      nadFunBondingCurve: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE' as `0x${string}`,
      nadFunRouter: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22' as `0x${string}`,
      nadFunDexRouter: '0x0B79d71AE99528D1dB24A4148b5f4F865cc2b137' as `0x${string}`,
      nadFunFactory: '0x6B5F564339DbAD6b780249827f2198a841FEB7F3' as `0x${string}`,
      nadFunLens: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea' as `0x${string}`,
      madHouseRouter: '0x6017684Bea9Cb6e9874fC6DBA4438271eBF9F5DA' as `0x${string}`,
      zeroXSettler: '0xC2D3689cF6cE2859a3ffBc8fE09ab4C8623766b8' as `0x${string}`,
      zeroXAllowanceHolder: '0x0000000000001fF3684f28c67538d4D072C22734' as `0x${string}`,
      feeAddress: '0x565E9c68fC827958551EDe5757461959206AB0bd' as `0x${string}`,
      stork: '0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62' as `0x${string}`,
    },
  },
};