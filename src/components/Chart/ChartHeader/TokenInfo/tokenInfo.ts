import iconmonad from '../../../../assets/iconmonad.png';
import iconsol from '../../../../assets/iconsol.png';
import iconusdt from '../../../../assets/iconusdt.png';
import iconwbtc from '../../../../assets/iconwbtc.png';
import iconweth from '../../../../assets/iconweth.png';
import iconwmonad from '../../../../assets/iconwmonad.png';
import iconsmon from '../../../../assets/iconsmon.png';
import iconaprmon from '../../../../assets/iconaprmon.png';
import iconshmon from '../../../../assets/iconshmon.png';

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

export const tokenData: Record<TokenSymbol, TokenInfoData> = {
  MON: {
    name: 'Monad',
    image: iconmonad,
    description:
      'The native token of the Monad blockchain, an innovative high performance EVM network supporting over 10,000 TPS.',
    website: 'https://www.monad.xyz/',
    twitter: 'https://twitter.com/monad_xyz',
    discord: 'https://discord.com/invite/monad',
    baseAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  },
  WMON: {
    name: 'Wrapped Monad',
    image: iconwmonad,
    description:
      "An ERC-20 wrapper of Monad's native token (MON) for greater compatibility with smart contracts.",
    website: 'https://www.monad.xyz/',
    twitter: 'https://twitter.com/monad_xyz',
    discord: 'https://discord.com/invite/monad',
    baseAddress: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  },
  WETH: {
    name: 'Wrapped Ethereum',
    image: iconweth,
    description:
      "An ERC-20 wrapper of Ethereum's native token (ETH) for greater compatiblity with smart contracts.",
    website: 'https://ethereum.org/',
    twitter: 'https://twitter.com/ethereum',
    discord: 'https://discord.com/invite/ethereum',
    baseAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  WBTC: {
    name: 'Wrapped Bitcoin',
    image: iconwbtc,
    description: 'An ERC-20 wrapper of Bitcoin on the Ethereum network.',
    website: 'https://www.wbtc.network/',
    twitter: 'https://x.com/WrappedBTC',
    baseAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  },
  WSOL: {
    name: 'Wrapped Solana',
    image: iconsol,
    description:
      'A high-performance blockchain platform known for its fast transaction speeds and low costs.',
    website: 'https://solana.com/',
    twitter: 'https://twitter.com/solana',
    discord: 'https://discord.com/invite/solana',
    baseAddress: '0x369CD1E20Fa7ea1F8e6dc0759709bA0bD978abE7',
  },
  USDT: {
    name: 'Tether USD',
    image: iconusdt,
    description:
      "The world's most widely-used stablecoin, pegged to the US Dollar at a 1:1 ratio.",
    website: 'https://tether.to/',
    twitter: 'https://twitter.com/Tether_to',
    baseAddress: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D',
  },
  sMON: {
    name: 'Kintsu Staked Monad',
    image: iconsmon,
    description:
      "sMON is Kintsu’s Liquid Staking Token on Monad, DAO-aligned, and designed to let users earn staking rewards while staying composable across the ecosystem.",
    website: 'https://kintsu.xyz/staking/',
    twitter: 'https://x.com/kintsu_xyz',
    discord: 'https://discord.com/invite/kintsu',
    baseAddress: '0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5',
  },
  aprMON: {
    name: 'aPriori Staked Monad',
    image: iconaprmon,
    description:
      "apr.",
    website: 'https://stake.apr.io/',
    twitter: 'https://x.com/apr_labs',
    discord: 'https://discord.com/invite/apriori',
    baseAddress: '0xb2f82D0f38dc453D596Ad40A37799446Cc89274A',
  },
  shMON: {
    name: 'shMonad',
    image: iconshmon,
    description:
      "shMON: The world's first Holistic Liquid Staking Token with the best staking rewards on Monad.",
    website: 'https://shmonad.xyz/',
    twitter: 'https://x.com/0xFastLane',
    discord: 'https://discord.fastlane.xyz',
    baseAddress: '0x3a98250F98Dd388C211206983453837C8365BDc1',
  },
};

export default tokenData;
