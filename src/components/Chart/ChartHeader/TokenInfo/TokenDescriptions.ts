import iconmonad from '../../../../assets/iconmonad.png';
import iconsol from '../../../../assets/iconsol.png';
import iconusdt from '../../../../assets/iconusdt.png';
import iconwbtc from '../../../../assets/iconwbtc.png';
import iconweth from '../../../../assets/iconweth.png';
import iconwmonad from '../../../../assets/iconwmonad.png';
import iconsmon from '../../../../assets/iconsmon.png';
import iconaprmon from '../../../../assets/iconaprmon.png';
import iconshmon from '../../../../assets/iconshmon.png';
import icondak from '../../../../assets/icondak.png';
import iconchog from '../../../../assets/iconchog.png';
import iconyaki from '../../../../assets/iconyaki.png';

import { useLanguage } from '../../../../contexts/LanguageContext';

export interface TokenInfoData {
  name: string;
  image: string;
  description: string;
  website: string;
  twitter?: string;
  discord?: string;
  github?: string;
  baseAddress?: string;
}

export type TokenSymbol = any;

export function useTokenData(): Record<TokenSymbol, TokenInfoData> {
  const { t } = useLanguage();
  return {
    MON: {
      name: 'Monad',
      image: iconmonad,
      description: t('monadDesc'),
      website: 'https://www.monad.xyz/',
      twitter: 'https://twitter.com/monad_xyz',
      discord: 'https://discord.com/invite/monad',
      baseAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    },
    WMON: {
      name: 'Wrapped Monad',
      image: iconwmonad,
      description: t('wMonDesc'),
      website: 'https://www.monad.xyz/',
      twitter: 'https://twitter.com/monad_xyz',
      discord: 'https://discord.com/invite/monad',
      baseAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
    },
    WETH: {
      name: 'Wrapped Ethereum',
      image: iconweth,
      description: t('wethDesc'),
      website: 'https://ethereum.org/',
      twitter: 'https://twitter.com/ethereum',
      discord: 'https://discord.com/invite/ethereum',
      baseAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    WBTC: {
      name: 'Wrapped Bitcoin',
      image: iconwbtc,
      description: t('wbtcDesc'),
      website: 'https://www.wbtc.network/',
      twitter: 'https://x.com/WrappedBTC',
      baseAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    },
    WSOL: {
      name: 'Wrapped Solana',
      image: iconsol,
      description: t('wsolDesc'),
      website: 'https://solana.com/',
      twitter: 'https://twitter.com/solana',
      discord: 'https://discord.com/invite/solana',
      baseAddress: '0x369CD1E20Fa7ea1F8e6dc0759709bA0bD978abE7',
    },
    USDT: {
      name: 'Tether USD',
      image: iconusdt,
      description: t('usdtDesc'),
      website: 'https://tether.to/',
      twitter: 'https://twitter.com/Tether_to',
      baseAddress: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
    },
    sMON: {
      name: 'Kintsu Staked Monad',
      image: iconsmon,
      description: t('smonDesc'),
      website: 'https://kintsu.xyz/staking/',
      twitter: 'https://x.com/kintsu_xyz',
      discord: 'https://discord.com/invite/kintsu',
      baseAddress: '0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5',
    },
    aprMON: {
      name: 'aPriori Monad LST',
      image: iconaprmon,
      description: t('aprmonDesc'),
      website: 'https://stake.apr.io/',
      twitter: 'https://x.com/apr_labs',
      discord: 'https://discord.com/invite/apriori',
      baseAddress: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
    },
    shMON: {
      name: 'shMonad',
      image: iconshmon,
      description: t('shmonDesc'),
      website: 'https://shmonad.xyz/',
      twitter: 'https://x.com/0xFastLane',
      discord: 'https://discord.fastlane.xyz',
      baseAddress: '0x3a98250F98Dd388C211206983453837C8365BDc1',
    },
    DAK: {
      name: 'Molandak',
      image: icondak,
      description: t('dakDesc'),
      website: 'https://testnet.monad.xyz/',
      twitter: 'https://x.com/monad_xyz',
      discord: 'https://discord.com/invite/monad',
      baseAddress: '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714',
    },
    CHOG: {
      name: 'Chog',
      image: iconchog,
      description: t('chogDesc'),
      website: 'https://testnet.monad.xyz/',
      twitter: 'https://x.com/monad_xyz',
      discord: 'https://discord.com/invite/monad',
      baseAddress: '0xE0590015A873bF326bd645c3E1266d4db41C4E6B',
    },
    YAKI: {
      name: 'Moyaki',
      image: iconyaki,
      description: t('yakiDesc'),
      website: 'https://testnet.monad.xyz/',
      twitter: 'https://x.com/monad_xyz',
      discord: 'https://discord.com/invite/monad',
      baseAddress: '0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50',
    },
  };
};

export default useTokenData;
