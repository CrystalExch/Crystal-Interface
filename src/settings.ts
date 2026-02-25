import iconmonad from './assets/iconmonad.png';
import iconwmonad from './assets/iconwmonad.png';
import iconusdc from './assets/iconusdc.png';
import iconusdt from './assets/iconusdt.png';
import iconausd from './assets/iconausd.png';
import iconwbtc from './assets/iconwbtc.png';
import iconweth from './assets/iconweth.png';
import iconsol from './assets/iconsol.png';
import icondak from './assets/icondak.png';
import iconchog from './assets/iconchog.png';
import iconyaki from './assets/iconyaki.png';
import iconsmon from './assets/iconsmon.png';
import iconshmon from './assets/iconshmon.png';
import iconaprmon from './assets/iconaprmon.png';
import iconxaut from './assets/iconxaut.png';
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
      httpurl: 'https://rpc.monad.xyz',
      wssurl: `wss://rpc-mainnet.monadinfra.com`,
      eth: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      weth: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
      usdc: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
      balancegetter: '0x545D53D5f6c77c85dd8f94d21f0Ac47118C5643b' as `0x${string}`,
      router: '0x2Cd24c8230618e26C149dce9cfb3fBb3d0a9ed54' as `0x${string}`,
      referralManager: '0x545D53D5f6c77c85dd8f94d21f0Ac47118C5643b' as `0x${string}`,
      launchpadRouter: '0x2Cd24c8230618e26C149dce9cfb3fBb3d0a9ed54' as `0x${string}`,
      crystalVaults: "0xA26393399b426658423597DfE12930BaE1a2F9da" as `0x${string}`,
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
          address: '0x235D84fA575B0370d47433A5b94e7547aA2f023d'.toLowerCase(),
          marketType: 2,
          precision: 5,
          scaleFactor: BigInt(10 ** 21),
          priceFactor: BigInt(1000000000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(1000000000000000),
          fee: BigInt(99970),
          makerRebate: BigInt(99995),
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
          address: '0x235D84fA575B0370d47433A5b94e7547aA2f023d'.toLowerCase(),
          marketType: 2,
          precision: 5,
          scaleFactor: BigInt(10 ** 21),
          priceFactor: BigInt(1000000000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(1000000000000000),
          fee: BigInt(99970),
          makerRebate: BigInt(99995),
          image: iconwmonad,
          website: 'https://www.monad.xyz/',
        },
        AUSDUSDC: {
          quoteAsset: 'USDC',
          baseAsset: 'WMON',
          path: [
            '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
            '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a',
          ],
          quoteAddress: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          baseAddress: '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a',
          quoteDecimals: BigInt(6),
          baseDecimals: BigInt(6),
          address: '0x8A34f54F0f5F2fEDfe2BEB1E46cFC7a25c0Df99b'.toLowerCase(),
          marketType: 0,
          scaleFactor: BigInt(10 ** 4),
          priceFactor: BigInt(10000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(100000),
          fee: BigInt(99990),
          makerRebate: BigInt(100000),
          image: iconausd,
          website: 'https://www.agora.finance/',
        },
        XAUt0USDC: {
          quoteAsset: 'USDC',
          baseAsset: 'WMON',
          path: [
            '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
            '0x01bFF41798a0BcF287b996046Ca68b395DbC1071',
          ],
          quoteAddress: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          baseAddress: '0x01bFF41798a0BcF287b996046Ca68b395DbC1071',
          quoteDecimals: BigInt(6),
          baseDecimals: BigInt(6),
          address: '0x2BbDd429044d054fb294d50981034Bd202b7CA13'.toLowerCase(),
          marketType: 2,
          precision: 5,
          scaleFactor: BigInt(10 ** 9),
          priceFactor: BigInt(1000000000),
          tickSize: BigInt(1),
          minSize: BigInt(1000000),
          maxPrice: BigInt(1000000000000000),
          fee: BigInt(99970),
          makerRebate: BigInt(99995),
          image: iconxaut,
          website: 'https://usdt0.to/gold',
        },
      },
      addresstomarket: Object.fromEntries([
        ['0x235D84fA575B0370d47433A5b94e7547aA2f023d', 'MONUSDC'],
        ['0x8A34f54F0f5F2fEDfe2BEB1E46cFC7a25c0Df99b', 'AUSDUSDC'],
        ['0x2BbDd429044d054fb294d50981034Bd202b7CA13', 'XAUt0USDC']
      ].map(([key, value]) => [key.toLowerCase(), value])),
      tokendict: {
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': {
          ticker: 'MON',
          name: 'Monad',
          address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          decimals: BigInt(18),
          image: iconmonad,
          website: 'https://www.monad.xyz/',
          descriptionKey: 'monadDesc',
          twitter: 'https://twitter.com/monad',
          discord: 'https://discord.com/invite/monad',
        },
        '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A': {
          ticker: 'WMON',
          name: 'Wrapped Monad',
          address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
          decimals: BigInt(18),
          image: iconwmonad,
          website: 'https://www.monad.xyz/',
          descriptionKey: 'wMonDesc',
          twitter: 'https://twitter.com/monad',
          discord: 'https://discord.com/invite/monad',
        },
        '0x754704Bc059F8C67012fEd69BC8A327a5aafb603': {
          ticker: 'USDC',
          name: 'USD Coin',
          address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
          decimals: BigInt(6),
          image: iconusdc,
        },
        '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a': {
          ticker: 'AUSD',
          name: 'Agora Dollar',
          address: '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a',
          decimals: BigInt(6),
          image: iconausd,
        },
        '0x01bFF41798a0BcF287b996046Ca68b395DbC1071': {
          ticker: 'XAUt0',
          name: 'Tether Gold',
          address: '0x01bFF41798a0BcF287b996046Ca68b395DbC1071',
          decimals: BigInt(6),
          image: iconxaut,
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