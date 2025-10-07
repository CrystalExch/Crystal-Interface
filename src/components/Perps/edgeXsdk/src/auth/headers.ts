/**
 * Authentication headers generation
 */

import {
  CreateAuthHeadersParams,
  AuthHeaders,
  SignatureParams,
  GenerateTradeParamsInput,
  TradeOrderSignatureType,
  GenerateTradeParamsOutput,
  ETHWithdrawInput,
  ETHWithdrawOutput,
  CrossWithdrawInput,
  CrossWithdrawOutput,
  ApiKeyData,
  L2KeyPair,
} from '../types/auth';
import { AuthError } from '../types/errors';
import {
  genApiSignature,
  generateOrderSignature,
  generateWithdrawalSignature,
  generateCrossWithdrawSignature,
} from './signature';
import { toQueryString, sortObjectByKeys, getCurrentTimestamp, checkPrefix } from './utils';

/**
 * Create authentication headers for EdgeX API requests
 */
export function createAuthHeaders(params: CreateAuthHeadersParams): AuthHeaders {
  const {
    apiKey,
    apiSecret,
    passphrase,
    method,
    path,
    params: queryParams,
    body,
    appName = 'EdgeX',
    timestamp = getCurrentTimestamp(),
  } = params;

  // Validate required parameters
  if (!apiKey || !apiSecret || !passphrase) {
    throw new AuthError('Missing required authentication credentials');
  }

  if (!method || !path) {
    throw new AuthError('Missing required request parameters');
  }

  try {
    // Prepare request body for signing
    // For GET requests, sign the filtered query params; otherwise sign the request body
    let requestBody = '';

    const upperMethod = method.toUpperCase();
    let signSource: any = undefined;

    if (upperMethod === 'GET' && queryParams) {
      const sanitized = Object.fromEntries(
        Object.entries(queryParams)
          .filter(([, v]) => typeof v !== 'undefined' && v !== '' && v !== null)
          .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
      );
      signSource = sanitized;
    } else if (typeof body !== 'undefined' && body !== null && body !== '') {
      signSource = body;
    }

    requestBody = toQueryString(sortObjectByKeys(signSource));

    // Determine the URI for signing
    // Private endpoints need "/api" prefix for signing (matches web implementation)
    let requestUri = path;
    if (path.includes('private') || path.includes('/v1/')) {
      requestUri = checkPrefix(path, '/api');
    }

    // Generate signature
    const signParams: SignatureParams = {
      timestamp,
      httpMethod: method.toUpperCase(),
      requestUri,
      requestBody,
      secret: apiSecret,
    };

    const signature = genApiSignature(signParams);

    // Create authentication headers
    const headers: AuthHeaders = {
      [`X-${appName}-Api-Key`]: apiKey,
      [`X-${appName}-Passphrase`]: passphrase,
      [`X-${appName}-Signature`]: signature,
      [`X-${appName}-Timestamp`]: timestamp,
      channel: 'webTypescriptSDK',
    };

    return headers;
  } catch (error) {
    throw new AuthError(`Failed to create authentication headers: ${error}`);
  }
}

/**
 * Create authentication headers with keystore
 * Convenience method that extracts credentials from keystore
 */
export function createAuthHeadersFromKeystore(
  keystore: { apiKey: string; apiSecret: string; apiPassphrase: string },
  method: string,
  path: string,
  data?: any,
  appName = 'EdgeX'
): AuthHeaders {
  const upperMethod = method.toUpperCase();
  return createAuthHeaders({
    apiKey: keystore.apiKey,
    apiSecret: keystore.apiSecret,
    passphrase: keystore.apiPassphrase,
    method,
    path,
    params: upperMethod === 'GET' ? data : undefined,
    body: upperMethod !== 'GET' ? data : undefined,
    appName,
  });
}

/**
 * Validate authentication headers
 */
export function validateAuthHeaders(headers: AuthHeaders, appName = 'EdgeX'): boolean {
  const requiredHeaders = [
    `X-${appName}-Api-Key`,
    `X-${appName}-Passphrase`,
    `X-${appName}-Signature`,
    `X-${appName}-Timestamp`,
    'channel',
  ];

  return requiredHeaders.every(header => {
    const value = headers[header];
    return typeof value === 'string' && value.length > 0;
  });
}

/**
 * Generate trade parameters with signatures for trading requests
 */
export async function generateTradeParams(
  input: GenerateTradeParamsInput
): Promise<GenerateTradeParamsOutput> {
  const {
    tradeParams,
    apiKeys,
    timestamp = getCurrentTimestamp(),
    requestPath = '/api/v1/private/order/createOrder',
    requestMethod = 'POST',
  } = input;

  const mainOrderSignature = await generateOrderSignature({
    input,
    signatureType: TradeOrderSignatureType.MAIN_ORDER,
  });
  const tradeRequestParams: Record<string, unknown> = {
    ...tradeParams,
    ...mainOrderSignature,
  };

  // Handle TP/SL orders
  if (tradeParams.isSetOpenTp && tradeParams.openTp) {
    const tpSignature = await generateOrderSignature({
      input,
      signatureType: TradeOrderSignatureType.OPEN_TAKE_PROFIT,
    });
    tradeRequestParams.openTp = {
      ...tradeParams.openTp,
      ...tpSignature,
    };
  }

  if (tradeParams.isSetOpenSl && tradeParams.openSl) {
    const slSignature = await generateOrderSignature({
      input,
      signatureType: TradeOrderSignatureType.OPEN_STOP_LOSS,
    });
    tradeRequestParams.openSl = {
      ...tradeParams.openSl,
      ...slSignature,
    };
  }

  // Create authentication headers
  const headers = createAuthHeaders({
    apiKey: apiKeys.apiKey,
    apiSecret: apiKeys.apiSecret,
    passphrase: apiKeys.apiPassphrase,
    method: requestMethod,
    path: requestPath,
    body: tradeRequestParams,
    timestamp,
  });

  return {
    headers,
    params: tradeRequestParams,
  };
}

/**
 * Generate ETH withdrawal parameters with L2 signature and authentication headers
 */
export async function generateETHWithdrawParams(
  input: ETHWithdrawInput,
  apiKeys: ApiKeyData,
  l2KeyPair: L2KeyPair,
  networkId: number,
  requestPath: string = '/api/v1/private/assets/createNormalWithdraw',
  requestMethod: string = 'POST',
  timestamp: string = getCurrentTimestamp()
): Promise<ETHWithdrawOutput> {
  try {
    const { accountId, coinId, amount, ethAddress, clientWithdrawId, expireTime } = input;
    if (!accountId || !coinId || !amount || !ethAddress || !clientWithdrawId || !expireTime) {
      throw new AuthError('Missing required withdrawal parameters');
    }

    if (!apiKeys.apiKey || !apiKeys.apiSecret || !apiKeys.apiPassphrase) {
      throw new AuthError('Missing API keys');
    }

    if (!l2KeyPair.l2PrivateKey) {
      throw new AuthError('Missing L2 private key');
    }

    if (!networkId) {
      throw new AuthError('Missing network ID');
    }

    // Generate L2 signature using the dedicated signature function
    const l2Signature = await generateWithdrawalSignature({
      amount,
      expireTime,
      clientWithdrawId,
      accountId,
      ethAddress,
      coinId,
      l2PrivateKey: l2KeyPair.l2PrivateKey,
      networkId,
    });

    // Create the final request parameters
    const params: ETHWithdrawInput = {
      ...input,
      l2Signature,
    };

    // Generate authentication headers
    const headers = createAuthHeaders({
      apiKey: apiKeys.apiKey,
      apiSecret: apiKeys.apiSecret,
      passphrase: apiKeys.apiPassphrase,
      method: requestMethod,
      path: requestPath,
      body: { ...params },
      timestamp,
    });

    return {
      headers,
      params,
    };
  } catch (error) {
    throw new AuthError(`Failed to generate ETH withdrawal parameters: ${error}`);
  }
}

/**
 * Generate cross-chain withdrawal parameters with L2 signature and authentication headers
 */
export async function generateCrossWithdrawParams(
  input: CrossWithdrawInput,
  apiKeys: ApiKeyData,
  l2KeyPair: L2KeyPair,
  networkId: number,
  requestPath: string = '/api/v1/private/assets/createCrossWithdraw',
  requestMethod: string = 'POST',
  timestamp: string = getCurrentTimestamp()
): Promise<CrossWithdrawOutput> {
  try {
    const {
      accountId,
      coinId,
      amount,
      ethAddress,
      erc20Address,
      lpAccountId,
      clientCrossWithdrawId,
      expireTime,
      fee,
      chainId,
      crossWithdrawL2Key,
    } = input;

    // Validate required parameters
    if (
      !accountId ||
      !coinId ||
      !amount ||
      !ethAddress ||
      !erc20Address ||
      !lpAccountId ||
      !clientCrossWithdrawId ||
      !expireTime ||
      !fee ||
      !chainId ||
      !crossWithdrawL2Key
    ) {
      throw new AuthError('Missing required cross-chain withdrawal parameters');
    }

    if (!apiKeys.apiKey || !apiKeys.apiSecret || !apiKeys.apiPassphrase) {
      throw new AuthError('Missing API keys');
    }

    if (!l2KeyPair.l2PrivateKey) {
      throw new AuthError('Missing L2 private key in keystore');
    }

    if (!networkId) {
      throw new AuthError('Missing network ID');
    }

    // Generate L2 signature using the dedicated signature function
    const l2Signature = await generateCrossWithdrawSignature({
      amount,
      expireTime,
      clientCrossWithdrawId,
      accountId,
      lpAccountId,
      crossWithdrawL2Key,
      l2PrivateKey: l2KeyPair.l2PrivateKey,
      chainId,
    });

    // Create the final request parameters
    const params: CrossWithdrawInput = {
      ...input,
      l2Signature,
    };

    // Generate authentication headers
    const headers = createAuthHeaders({
      apiKey: apiKeys.apiKey,
      apiSecret: apiKeys.apiSecret,
      passphrase: apiKeys.apiPassphrase,
      method: requestMethod,
      path: requestPath,
      body: { ...params },
      timestamp,
    });

    return {
      headers,
      params,
    };
  } catch (error) {
    throw new AuthError(`Failed to generate cross-chain withdrawal parameters: ${error}`);
  }
}
