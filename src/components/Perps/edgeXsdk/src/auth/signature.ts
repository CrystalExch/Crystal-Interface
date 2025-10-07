/**
 * Signature generation utilities
 * Using viem's keccak256 and js-sha256 to match edgex-web implementation
 */

import { sha256 } from 'js-sha256';
import { SignatureParams } from '../types/auth';
import { AuthError } from '../types/errors';
import {
  SignableOrder,
  SignableWithdrawal,
  SignableTransfer,
  clientIdToNonce,
} from '../starkex-lib';
import BigNumber from 'bignumber.js';
import { GenerateTradeParamsInput, TradeOrderSignatureType, TYPE_orderType } from '../types/auth';
import { calculateL2Price, generateRandomClientId } from './utils';

/**
 * Generate HMAC-SHA256 signature using js-sha256 (matches edgex-web implementation exactly)
 */
function generateHmacSha256(key: string, message: string): string {
  try {
    // Match edgex-web implementation exactly:
    // 1. Encode the key using encodeURI
    const encode = encodeURI(key);
    // 2. Convert to base64
    const keyBytes = btoa(encode);
    // 3. Encode message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // 4. Create HMAC using js-sha256 (same as edgex-web)
    const hmac = sha256.hmac.create(keyBytes);
    hmac.update(messageBytes);
    const signature = hmac.hex();

    return signature;
  } catch (error) {
    throw new AuthError(`Failed to generate HMAC signature: ${error}`);
  }
}

/**
 * Generate API signature for authenticated requests
 * Using js-sha256 to match edgex-web implementation exactly
 */
export function genApiSignature(params: SignatureParams): string {
  const { timestamp, httpMethod, requestUri, requestBody, secret } = params;

  // Validate required parameters
  if (!timestamp || !httpMethod || !requestUri || secret === undefined) {
    throw new AuthError('Missing required parameters for signature generation');
  }

  // Create the message from concatenation of timestamp, httpMethod, requestUri, and requestBody
  const message = timestamp + httpMethod + requestUri + requestBody;

  // Generate signature using js-sha256 (matches edgex-web)
  return generateHmacSha256(secret, message);
}

/**
 * Generate L2 signature parameters for main order
 */
export async function generateOrderSignature({
  input,
  signatureType,
}: {
  input: GenerateTradeParamsInput;
  signatureType: TradeOrderSignatureType;
}): Promise<Record<string, string>> {
  const { tradeParams, symbolInfo, l2KeyPair, chainInfo, accountInfo } = input;
  const { chainId } = chainInfo;
  const { accountId } = accountInfo;
  const { l2PrivateKey } = l2KeyPair;

  let size, side, l2Price;
  if (signatureType === TradeOrderSignatureType.MAIN_ORDER) {
    size = tradeParams.size;
    side = tradeParams.side;
    l2Price = calculateL2Price(
      {
        type: tradeParams.type,
        side: tradeParams.side,
        price: tradeParams.price,
      },
      symbolInfo
    );
  } else if (signatureType === TradeOrderSignatureType.OPEN_TAKE_PROFIT) {
    size = tradeParams?.openTp?.size;
    side = tradeParams?.openTp?.side;
    l2Price = calculateL2Price(
      {
        type: TYPE_orderType.MARKET,
        side: tradeParams?.openTp?.side as string,
        price: tradeParams?.openTp?.price as string,
      },
      symbolInfo
    );
  } else if (signatureType === TradeOrderSignatureType.OPEN_STOP_LOSS) {
    size = tradeParams?.openSl?.size;
    side = tradeParams?.openSl?.side;
    l2Price = calculateL2Price(
      {
        type: TYPE_orderType.MARKET,
        side: tradeParams?.openSl?.side as string,
        price: tradeParams?.openSl?.price as string,
      },
      symbolInfo
    );
  }

  const clientId = generateRandomClientId();
  const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const l1Expiration = expiration - 9 * 24 * 60 * 60 * 1000; // L1 expiration is 9 days less
  const l2Value = BigNumber(l2Price as string)
    .multipliedBy(size as string)
    .toString();
  const limitFee = BigNumber.max(symbolInfo.takerFeeRate, symbolInfo.makerFeeRate)
    .multipliedBy(l2Value)
    .toFixed(0, BigNumber.ROUND_CEIL);

  const orderToSign = {
    humanSize: `${Number(size)}`,
    humanPrice: l2Price,
    limitFee,
    symbol: symbolInfo.symbol || symbolInfo.contractName,
    expirationIsoTimestamp: expiration,
    clientId,
    positionId: accountId,
    side: side,
  };

  const starkOrder = SignableOrder.fromOrder(orderToSign, chainId);
  const signature = await starkOrder.sign(l2PrivateKey);

  return {
    clientOrderId: clientId,
    expireTime: l1Expiration.toString(),
    l2Nonce: clientIdToNonce(clientId).toString(),
    l2Value,
    l2Size: size as string,
    l2LimitFee: limitFee,
    l2ExpireTime: expiration.toString(),
    l2Signature: signature,
  };
}

/**
 * Generate L2 signature for ETH withdrawal
 */
export async function generateWithdrawalSignature({
  amount,
  expireTime,
  clientWithdrawId,
  accountId,
  ethAddress,
  coinId,
  l2PrivateKey,
  networkId = 1,
}: {
  amount: string;
  expireTime: string;
  clientWithdrawId: string;
  accountId: string;
  ethAddress: string;
  coinId: string;
  l2PrivateKey: string;
  networkId?: number;
}): Promise<string> {
  try {
    const withdrawalToSign = {
      humanAmount: amount,
      expirationIsoTimestamp: expireTime,
      clientId: clientWithdrawId,
      positionId: accountId,
      ethAddress: ethAddress,
    };

    // Create signable withdrawal and generate L2 signature
    const starkWithdrawal = SignableWithdrawal.fromWithdrawal(withdrawalToSign, networkId, coinId);
    const l2Signature = await starkWithdrawal.sign(l2PrivateKey);

    return l2Signature;
  } catch (error) {
    throw new AuthError(`Failed to generate withdrawal signature: ${error}`);
  }
}

/**
 * Generate L2 signature for cross-chain withdrawal using SignableTransfer
 */
export async function generateCrossWithdrawSignature({
  amount,
  expireTime,
  clientCrossWithdrawId,
  accountId,
  lpAccountId,
  crossWithdrawL2Key,
  l2PrivateKey,
  chainId,
}: {
  amount: string;
  expireTime: string;
  clientCrossWithdrawId: string;
  accountId: string;
  lpAccountId: string;
  crossWithdrawL2Key: string;
  l2PrivateKey: string;
  chainId: number;
}): Promise<string> {
  try {
    const transferToSign = {
      humanAmount: amount,
      expirationIsoTimestamp: expireTime,
      receiverPositionId: lpAccountId,
      senderPositionId: accountId,
      receiverPublicKey: crossWithdrawL2Key,
      clientId: clientCrossWithdrawId,
    };

    // Generate L2 signature using SignableTransfer
    const starkTransfer = SignableTransfer.fromTransfer(transferToSign, chainId);
    const l2Signature = await starkTransfer.sign(l2PrivateKey);

    return l2Signature;
  } catch (error) {
    throw new AuthError(`Failed to generate cross-chain withdrawal signature: ${error}`);
  }
}
