/**
 * Configuration type definitions
 */

/**
 * Coin information in metadata
 */
export interface CoinInfo {
  coinId: string;
  coinName: string;
  stepSize: string;
  showStepSize: string;
  iconUrl: string;
  starkExAssetId: string | null;
  starkExResolution: string | null;
}

/**
 * Risk tier information for contracts
 */
export interface RiskTier {
  tier: number;
  positionValueUpperBound: string;
  maxLeverage: string;
  maintenanceMarginRate: string;
  starkExRisk: string;
  starkExUpperBound: string;
}

/**
 * Contract information in metadata
 */
export interface ContractInfo {
  contractId: string;
  contractName: string;
  baseCoinId: string;
  quoteCoinId: string;
  tickSize: string;
  stepSize: string;
  minOrderSize: string;
  maxOrderSize: string;
  maxOrderBuyPriceRatio: string;
  minOrderSellPriceRatio: string;
  maxPositionSize: string;
  maxMarketPositionSize: string;
  riskTierList: RiskTier[];
  defaultTakerFeeRate: string;
  defaultMakerFeeRate: string;
  defaultLeverage: string;
  liquidateFeeRate: string;
  enableTrade: boolean;
  enableDisplay: boolean;
  enableOpenPosition: boolean;
  fundingInterestRate: string;
  fundingImpactMarginNotional: string;
  fundingMaxRate: string;
  fundingMinRate: string;
  fundingRateIntervalMin: string;
  displayDigitMerge: string;
  displayMaxLeverage: string;
  displayMinLeverage: string;
  displayNewIcon: boolean;
  displayHotIcon: boolean;
  matchServerName: string;
  starkExSyntheticAssetId: string;
  starkExResolution: string;
  starkExOraclePriceQuorum: string;
  starkExOraclePriceSignedAssetId: string[];
  starkExOraclePriceSigner: string[];
}

/**
 * Token information in chain
 */
export interface TokenInfo {
  tokenAddress: string;
  decimals: string;
  iconUrl: string;
  token: string;
  pullOff: boolean;
  withdrawEnable: boolean;
  useFixedRate: boolean;
  fixedRate: string;
  contractAddress: string;
}

/**
 * Chain information in multiChain
 */
export interface ChainInfo {
  chain: string;
  chainId: string;
  chainIconUrl: string;
  contractAddress: string;
  depositGasFeeLess: boolean;
  feeLess: boolean;
  feeRate: string;
  gasLess: boolean;
  gasToken: string;
  minFee: string;
  rpcUrl: string;
  webTxUrl: string;
  withdrawGasFeeLess: boolean;
  tokenList: TokenInfo[];
  txConfirm: string;
  blockTime: string;
  allowAaDeposit: boolean;
  allowAaWithdraw: boolean;
  allowDeposit: boolean;
  allowWithdraw: boolean;
  appRpcUrl: string;
}

/**
 * Global configuration in metadata
 */
export interface GlobalConfig {
  appName: string;
  appEnv: string;
  appOnlySignOn: string;
  feeAccountId: string;
  feeAccountL2Key: string;
  poolAccountId: string;
  poolAccountL2Key: string;
  fastWithdrawAccountId: string;
  fastWithdrawAccountL2Key: string;
  fastWithdrawMaxAmount: string;
  fastWithdrawRegistryAddress: string;
  starkExChainId: string;
  starkExContractAddress: string;
  starkExCollateralCoin: CoinInfo;
  starkExMaxFundingRate: number;
  starkExOrdersTreeHeight: number;
  starkExPositionsTreeHeight: number;
  starkExFundingValidityPeriod: number;
  starkExPriceValidityPeriod: number;
  maintenanceReason: string;
}

/**
 * MultiChain configuration in metadata
 */
export interface MultiChainConfig {
  coinId: string;
  maxWithdraw: string;
  minWithdraw: string;
  minDeposit: string;
  chainList: ChainInfo[];
}

/**
 * Complete metadata structure
 */
export interface Metadata {
  coinList: CoinInfo[];
  contractList: ContractInfo[];
  global: GlobalConfig;
  multiChain: MultiChainConfig;
}

/**
 * EdgeX SDK Configuration
 */
export interface EdgeXConfig {
  /** Use testnet environment (default: false) */
  testnet?: boolean;

  /** Base URL for REST API (optional, auto-determined from testnet) */
  baseURL?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable debug logging (default: false) */
  debug?: boolean;

  /** Custom headers to include with all requests */
  customHeaders?: Record<string, string>;

  /** Metadata configuration for StarkEx operations */
  metadata?: Metadata;
}

/**
 * Environment-specific endpoints
 */
export const ENDPOINTS = {
  PRODUCTION: 'https://pro.edgex.exchange',
  TESTNET: 'https://testnet.edgex.exchange',
} as const;
