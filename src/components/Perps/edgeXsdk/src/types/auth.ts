/**
 * Authentication-related type definitions
 */

/**
 * API key credentials generated from wallet signature
 */
export interface ApiKeyData {
  /** UUID format API key */
  apiKey: string;
  /** Base64URL encoded passphrase */
  apiPassphrase: string;
  /** Base64URL encoded secret for signing */
  apiSecret: string;
}

/**
 * Layer 2 key pair for StarkEx operations
 */
export interface L2KeyPair {
  /** Private key for L2 operations */
  l2PrivateKey: string;
  /** Public key for L2 operations */
  l2PublicKey: string;
  /** Y coordinate of public key */
  l2PublicKeyY: string;
}

/**
 * Complete EdgeX keystore containing both API and L2 credentials
 */
export interface EdgeXKeystore extends ApiKeyData, L2KeyPair {}

/**
 * Authentication headers for API requests
 */
export interface AuthHeaders {
  [key: string]: string;
}

/**
 * Parameters for generating API signatures
 */
export interface SignatureParams {
  /** Request timestamp in milliseconds */
  timestamp: string;
  /** HTTP method (GET, POST, etc.) */
  httpMethod: string;
  /** Request URI path */
  requestUri: string;
  /** Request body as query string */
  requestBody: string;
  /** API secret for signing */
  secret: string;
}

/**
 * Parameters for creating authentication headers
 */
export interface CreateAuthHeadersParams {
  /** API key */
  apiKey: string;
  /** API secret */
  apiSecret: string;
  /** API passphrase */
  passphrase: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** URL query params for GET requests (optional) */
  params?: Record<string, unknown>;
  /** Request body (optional) */
  body?: Record<string, unknown> | string | null;
  /** App name for header prefix (default: 'EdgeX') */
  appName?: string;
  /** Request timestamp in milliseconds (optional, default: current time) */
  timestamp?: string;
}

/**
 * Wallet signature data for keystore generation
 */
export interface WalletSignatures {
  /** API signature from wallet */
  apiSignature: string;
  /** Stark signature from wallet */
  starkSignature: string;
}

/**
 * Symbol model for trading operations
 */
export interface SymbolModel {
  /** Contract ID */
  contractId: string;
  /** Symbol name */
  symbol: string;
  /** Contract name */
  contractName: string;
  /** Tick size */
  tickSize: string;
  /** Taker fee rate */
  takerFeeRate: string;
  /** Maker fee rate */
  makerFeeRate: string;
  /** Oracle price */
  oraclePrice: string;
}

/**
 * Take profit/Stop loss order parameters
 */
export interface TpSlOrderParams {
  /** Order side: BUY, SELL */
  side: string;
  /** Order size */
  size: string;
  /** Order price */
  price: string;
  /** Trigger price */
  triggerPrice: string;
  /** Trigger price type: LAST_PRICE, INDEX_PRICE, ORACLE_PRICE */
  triggerPriceType: string;
}

/**
 * Trade order parameters for generateTradeParams
 */
export interface TradeOrderParams {
  /** Account ID */
  accountId: string;
  /** Contract ID */
  contractId: string;
  /** Order type: MARKET, LIMIT, STOP_MARKET, STOP_LIMIT, TAKE_PROFIT_MARKET, TAKE_PROFIT_LIMIT */
  type: string;
  /** Order side: BUY, SELL */
  side: string;
  /** Order size */
  size: string;
  /** Order price */
  price: string;
  /** Time in force: GOOD_TIL_CANCEL, IMMEDIATE_OR_CANCEL, FILL_OR_KILL */
  timeInForce: string;
  /** Reduce only flag */
  reduceOnly: boolean;
  /** Trigger price for conditional orders */
  triggerPrice?: string;
  /** Trigger price type for conditional orders */
  triggerPriceType?: string;
  /** Is position TP/SL */
  isPositionTpsl: boolean;
  /** Is setting open TP */
  isSetOpenTp: boolean;
  /** Is setting open SL */
  isSetOpenSl: boolean;
  /** Extra type field */
  extraType?: string;
  /** Extra data JSON field */
  extraDataJson?: string;
  /** Open take profit parameters */
  openTp?: TpSlOrderParams;
  /** Open stop loss parameters */
  openSl?: TpSlOrderParams;
}

export interface AccountInfo {
  accountId: string;
}

/**
 * Parameters for generateTradeParams function
 */
export interface GenerateTradeParamsInput {
  /** Trade order parameters */
  tradeParams: TradeOrderParams;
  /** Symbol information */
  symbolInfo: SymbolModel;
  /** API keys */
  apiKeys: ApiKeyData;
  /** L2 key pair */
  l2KeyPair: L2KeyPair;
  /** Chain information */
  chainInfo: {
    chainId: string;
  };
  /** Account information */
  accountInfo: AccountInfo;
  /** Request timestamp in milliseconds */
  timestamp?: string;
  /** Request path */
  requestPath?: string;
  /** HTTP method */
  requestMethod?: string;
}

/**
 * Generated trade parameters output
 */
export interface GenerateTradeParamsOutput {
  /** Authentication headers */
  headers: AuthHeaders;
  /** Trade request parameters */
  params: Record<string, unknown>;
}

export enum TradeOrderSignatureType {
  MAIN_ORDER = 'mainOrder',
  OPEN_TAKE_PROFIT = 'openTp',
  OPEN_STOP_LOSS = 'openSl',
}

/**
 * ETH withdrawal parameters input
 */
export interface ETHWithdrawInput {
  /** Account ID */
  accountId: string;
  /** Coin ID */
  coinId: string;
  /** Withdrawal amount */
  amount: string;
  /** Ethereum address for withdrawal */
  ethAddress: string;
  /** Client withdrawal ID */
  clientWithdrawId: string;
  /** Expiration time in milliseconds */
  expireTime: string;
  /** L2 signature */
  l2Signature?: string;
}

/**
 * ETH withdrawal parameters output
 */
export interface ETHWithdrawOutput {
  /** Authentication headers */
  headers: AuthHeaders;
  /** Withdrawal request parameters */
  params: ETHWithdrawInput;
}

/**
 * Cross-chain withdrawal parameters input
 */
export interface CrossWithdrawInput {
  /** Account ID */
  accountId: string;
  /** Coin ID */
  coinId: string;
  /** Withdrawal amount */
  amount: string;
  /** Ethereum address for withdrawal */
  ethAddress: string;
  /** ERC20 token address */
  erc20Address: string;
  /** LP account ID */
  lpAccountId: string;
  /** Client cross withdrawal ID */
  clientCrossWithdrawId: string;
  /** Expiration time in milliseconds */
  expireTime: string;
  /** Fee amount */
  fee: string;
  /** Chain ID */
  chainId: number;
  /** Cross withdraw L2 key */
  crossWithdrawL2Key: string;
  /** L2 signature */
  l2Signature?: string;
}

/**
 * Cross-chain withdrawal parameters output
 */
export interface CrossWithdrawOutput {
  /** Authentication headers */
  headers: AuthHeaders;
  /** Cross-chain withdrawal request parameters */
  params: CrossWithdrawInput;
}

export const TYPE_orderType = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP_LIMIT: 'STOP_LIMIT',
  STOP_MARKET: 'STOP_MARKET',
  TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT',
  TAKE_PROFIT_MARKET: 'TAKE_PROFIT_MARKET',
};
