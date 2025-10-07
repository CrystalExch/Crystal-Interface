/**
 * Keystore generation utilities
 * Using viem's keccak256 to match edgex-web implementation
 */

import { keccak256 } from 'viem';
import { ApiKeyData, L2KeyPair, EdgeXKeystore } from '../types/auth';
import { AuthError } from '../types/errors';
import {
  hexToByteArray,
  byteArrayToHex,
  uuidFormat,
  urlBase64Encode,
  subArray,
  hexToBn,
  asEcKeyPair,
  asSimpleKeyPair,
  stripHexPrefix,
} from './utils';

/**
 * Generate API key data from wallet signature
 */
export function generateApiKeyFromSignature(signature: string): ApiKeyData {
  try {
    // signature string
    const tempSignature = signature.replace('0x', '');
    // 64 bit signature Uint8Array
    const tempBuffer = hexToByteArray(tempSignature);
    // buffer slice 0~31 is then encrypted with keccak256
    const r_buffer_hash = keccak256(subArray(tempBuffer, 0, 32));
    // buffer slice 32~64 is then encrypted with keccak256
    const s_buffer_hash = keccak256(subArray(tempBuffer, 32, 32));
    // apikey "be923ec2-aea9-c91a-2c28-33ddcefaf7c1"
    const apiKey = uuidFormat(byteArrayToHex(subArray(hexToByteArray(s_buffer_hash), 0, 16)));
    // used to generate sha3 keccak256 signatures
    const apiSecret = urlBase64Encode(subArray(hexToByteArray(r_buffer_hash), 0, 32));
    // password used for encryption and decryption
    const apiPassphrase = urlBase64Encode(subArray(hexToByteArray(s_buffer_hash), 16, 16));

    return {
      apiKey,
      apiPassphrase,
      apiSecret,
    };
  } catch (error) {
    throw new AuthError(`Failed to generate API key from signature: ${error}`);
  }
}

/**
 * Generate StarkEx key pair from signature data
 * @param data - Raw signature bytes
 * @returns L2 key pair with private/public keys
 */
const keyPairFromData = (data: Uint8Array) => {
  if (data.length === 0) {
    throw new Error('keyPairFromData: Empty buffer');
  }
  const hashedData = keccak256(data);
  const hashBN = hexToBn(hashedData);
  const privateKey = hashBN.iushrn(5).toString('hex'); // Remove the last five bits.
  return asSimpleKeyPair(asEcKeyPair(privateKey));
};

/**
 * Generate L2 key pair from Stark signature
 */
export function generateL2KeyPairFromSignature(signature: string): L2KeyPair {
  try {
    const signatureBuffer = Buffer.from(stripHexPrefix(signature), 'hex');
    const keyPair = keyPairFromData(signatureBuffer);

    return {
      l2PrivateKey: keyPair.privateKey,
      l2PublicKey: keyPair.publicKey,
      l2PublicKeyY: keyPair.publicKeyYCoordinate,
    };
  } catch (error) {
    throw new AuthError(`Failed to generate L2 key pair from signature: ${error}`);
  }
}

/**
 * Generate complete EdgeX keystore from wallet signatures
 */
export function generateKeystore(apiSignature: string, starkSignature: string): EdgeXKeystore {
  try {
    // Generate API key data from API signature
    const apiKeyData = generateApiKeyFromSignature(apiSignature);

    // Generate L2 key pair from Stark signature
    const l2KeyPair = generateL2KeyPairFromSignature(starkSignature);

    // Combine into complete keystore
    return {
      ...apiKeyData,
      ...l2KeyPair,
    };
  } catch (error) {
    throw new AuthError(`Failed to generate keystore: ${error}`);
  }
}

/**
 * Validate keystore completeness
 */
export function validateKeystore(keystore: Partial<EdgeXKeystore>): keystore is EdgeXKeystore {
  const requiredFields: (keyof EdgeXKeystore)[] = [
    'apiKey',
    'apiPassphrase',
    'apiSecret',
    'l2PrivateKey',
    'l2PublicKey',
    'l2PublicKeyY',
  ];

  return requiredFields.every(field => {
    const value = keystore[field];
    return typeof value === 'string' && value.length > 0;
  });
}
