import BN from 'bn.js';
import { keccak256 } from 'ethereum-cryptography/keccak';
import _ from 'lodash';
import { normalizeHex32 } from './lib/util';
import metadataManager from './metadata-manager';
import { Buffer } from 'buffer';

export const TradeAsset = {
  USDC: 'USDC',
  USDT: 'USDT',
  BTC: 'BTC',
  ETH: 'ETH',
  LINK: 'LINK',
  AAVE: 'AAVE',
  UNI: 'UNI',
  SUSHI: 'SUSHI',
  SOL: 'SOL',
  YFI: 'YFI',
  ONEINCH: '1INCH',
  AVAX: 'AVAX',
  SNX: 'SNX',
  CRV: 'CRV',
  UMA: 'UMA',
  DOT: 'DOT',
  DOGE: 'DOGE',
  MATIC: 'MATIC',
  MKR: 'MKR',
  FIL: 'FIL',
  ADA: 'ADA',
  ATOM: 'ATOM',
  COMP: 'COMP',
  BCH: 'BCH',
  LTC: 'LTC',
  EOS: 'EOS',
  ALGO: 'ALGO',
  ZRX: 'ZRX',
  XMR: 'XMR',
  ZEC: 'ZEC',
  ENJ: 'ENJ',
  ETC: 'ETC',
  XLM: 'XLM',
  TRX: 'TRX',
  XTZ: 'XTZ',
  HNT: 'HNT',
};

export const ALL_ASSETS = Object.values(TradeAsset);
export const COLLATERAL_ASSET = TradeAsset.USDC;
export const SYNTHETIC_ASSETS = _.without(ALL_ASSETS, COLLATERAL_ASSET);

/**
 * The resolution represents the number of decimals of precision used in the Starkware system.
 *
 * For example, a resolution of 9 for ETH means that 1e-9 ETH = 1 Gwei is the smallest unit.
 */
export const ASSET_RESOLUTION = {
  [TradeAsset.USDT]: 6,
  [TradeAsset.USDC]: 6,
  [TradeAsset.BTC]: 10,
  [TradeAsset.ETH]: 3,
  [TradeAsset.LINK]: 7,
  [TradeAsset.AAVE]: 8,
  [TradeAsset.UNI]: 7,
  [TradeAsset.SUSHI]: 7,
  [TradeAsset.SOL]: 7,
  [TradeAsset.YFI]: 10,
  [TradeAsset.ONEINCH]: 7,
  [TradeAsset.AVAX]: 7,
  [TradeAsset.SNX]: 7,
  [TradeAsset.CRV]: 6,
  [TradeAsset.UMA]: 7,
  [TradeAsset.DOT]: 7,
  [TradeAsset.DOGE]: 5,
  [TradeAsset.MATIC]: 6,
  [TradeAsset.MKR]: 9,
  [TradeAsset.FIL]: 7,
  [TradeAsset.ADA]: 6,
  [TradeAsset.ATOM]: 7,
  [TradeAsset.COMP]: 8,
  [TradeAsset.BCH]: 8,
  [TradeAsset.LTC]: 8,
  [TradeAsset.EOS]: 6,
  [TradeAsset.ALGO]: 6,
  [TradeAsset.ZRX]: 6,
  [TradeAsset.XMR]: 8,
  [TradeAsset.ZEC]: 8,
  [TradeAsset.ENJ]: 6,
  [TradeAsset.ETC]: 7,
  [TradeAsset.XLM]: 5,
  [TradeAsset.TRX]: 4,
  [TradeAsset.XTZ]: 6,
  [TradeAsset.HNT]: 7,
};

export const COLLATERAL_ASSET_ID_BY_NETWORK_ID = token => {
  const metadata = metadataManager.getState()?.metadata;
  const coinList = metadata?.coinList;
  const contractList = metadata?.contractList;

  if (!token) {
    return coinList?.find(i => i?.coinId === metadata?.global?.starkExCollateralCoin?.coinId)
      ?.starkExAssetId;
  }

  const tar = contractList?.find(i => i.baseCoinId === token?.toString());
  const quoteId = tar?.quoteCoinId;
  // quote starkExAssetId (usdc/usdt/...)
  return coinList?.find(i => i?.coinId === quoteId)?.starkExAssetId;
};
/**
 * Mapping from a synthetic asset to its asset ID.
 */
export const SYNTHETIC_ASSET_ID_MAP = _.chain(SYNTHETIC_ASSETS)
  .keyBy()
  .mapValues(makeSyntheticAssetId)
  .value();

/**
 * The smallest unit of the asset in the Starkware system, represented in canonical (human) units.
 */
export const ASSET_QUANTUM_SIZE = _.mapValues(ASSET_RESOLUTION, resolution => `1e-${resolution}`);

/**
 * Construct the asset ID (as a 0x-prefixed hex string) for the collateral asset, given the address.
 */
function makeCollateralAssetId(tokenAddress, quantization = 1) {
  const data = Buffer.concat([
    keccak256(Buffer.from('ERC20Token(address)')).slice(0, 4),
    Buffer.from(normalizeHex32(tokenAddress), 'hex'),
    Buffer.from(normalizeHex32(new BN(quantization).toString(16)), 'hex'),
  ]);
  const result = keccak256(data);
  const resultBN = new BN(result.toString('hex'), 16);
  resultBN.imaskn(250);
  return `0x${normalizeHex32(resultBN.toString(16))}`;
}

/**
 * Construct the asset ID (as a 0x-prefixed hex string) for a given synthetic asset.
 */
function makeSyntheticAssetId(asset) {
  const assetIdString = `${asset}-${ASSET_RESOLUTION[asset]}`;
  const assetIdHex = Buffer.from(assetIdString).toString('hex').padEnd(30, '0');
  return `0x${assetIdHex}`;
}
