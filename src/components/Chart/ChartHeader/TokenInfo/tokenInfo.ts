import iconmonad from '../../../../assets/iconmonad.png';
import iconsol from '../../../../assets/iconsol.png';
import iconusdt from '../../../../assets/iconusdt.png';
import iconwbtc from '../../../../assets/iconwbtc.png';
import iconweth from '../../../../assets/iconweth.png';
import iconwmonad from '../../../../assets/iconwmonad.png';

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

export type TokenSymbol =
  | 'WETH'
  | 'WBTC'
  | 'MON'
  | 'WMON'
  | 'WSOL'
  | 'USDT'

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
};

export default tokenData;
