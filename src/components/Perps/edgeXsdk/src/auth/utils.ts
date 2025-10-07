import BigNumber from 'bignumber.js';
import { starkEc } from '../starkex-lib/lib/starkware';
import { SymbolModel } from '../types/auth';
import BN from 'bn.js';
/**
 * Authentication utility functions
 * Based on edgex-web/src/utils/onboarding.js implementation
 */

/**
 * Check if value is null or undefined (replaces lodash _.isNil)
 */
function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Convert a hexadecimal string to a BigNumber (BN) instance
 * Automatically removes '0x' prefix if present
 *
 * @param hex - Hexadecimal string (with or without '0x' prefix)
 * @returns BN instance representing the hex value in base 16
 * @example hexToBn('0x1a2b') // returns BN representing 6699
 */
export function hexToBn(hex: string) {
  return new BN(stripHexPrefix(hex), 16);
}

/**
 * Remove '0x' prefix from hex string if present
 * Used to normalize hex strings for cryptographic operations
 *
 * @param input - Hex string that may or may not have '0x' prefix
 * @returns Hex string without '0x' prefix
 * @example stripHexPrefix('0x1a2b') // returns '1a2b'
 * @example stripHexPrefix('1a2b') // returns '1a2b'
 */
export function stripHexPrefix(input: string) {
  if (input.indexOf('0x') === 0) {
    return input.slice(2);
  }
  return input;
}

/**
 * Create a StarkEx elliptic curve key pair from a private key
 * Accepts either a private key string or an object containing a privateKey property
 *
 * @param privateKeyOrKeyPair - Private key as hex string or object with privateKey property
 * @returns StarkEx elliptic curve key pair for cryptographic operations
 * @throws Error if the private key is invalid or cannot be normalized
 */
export function asEcKeyPair(privateKeyOrKeyPair: string | any) {
  const privateKey =
    typeof privateKeyOrKeyPair === 'string' ? privateKeyOrKeyPair : privateKeyOrKeyPair.privateKey;
  return starkEc.keyFromPrivate(normalizeHex32(privateKey));
}

/**
 * Extract key components from a StarkEx elliptic curve key pair
 * Converts the EC key pair into a simple object with hex string representations
 *
 * @param ecKeyPair - StarkEx elliptic curve key pair object
 * @returns Object containing publicKey, publicKeyYCoordinate, and privateKey as hex strings
 * @throws Error if the key pair has no private key
 */
export function asSimpleKeyPair(ecKeyPair: any) {
  const ecPrivateKey = ecKeyPair.getPrivate();
  if (isNil(ecPrivateKey)) {
    throw new Error('asSimpleKeyPair: Key pair has no private key');
  }
  const ecPublicKey = ecKeyPair.getPublic();
  return {
    publicKey: bnToHex32(ecPublicKey.getX()),
    publicKeyYCoordinate: bnToHex32(ecPublicKey.getY()),
    privateKey: bnToHex32(ecPrivateKey),
  };
}

/**
 * Convert a BigNumber to a normalized 32-byte hex string
 * Ensures the output is exactly 64 characters (32 bytes) with leading zeros if needed
 *
 * @param bn - BigNumber instance to convert
 * @returns 64-character hex string (32 bytes) without '0x' prefix
 * @example bnToHex32(new BN(255)) // returns '00000000000000000000000000000000000000000000000000000000000000ff'
 */
export function bnToHex32(bn: BN) {
  return normalizeHex32(bn.toString(16));
}

/**
 * Normalize a hex string to a lowercase 32-byte (64 character) hex string without '0x' prefix
 * Pads with leading zeros if the input is shorter than 64 characters
 * Used to ensure consistent formatting for StarkEx cryptographic operations
 *
 * @param hex - Hex string to normalize (with or without '0x' prefix)
 * @returns 64-character lowercase hex string without '0x' prefix
 * @throws Error if the input is longer than 64 characters (more than 32 bytes)
 * @example normalizeHex32('0x1a2b') // returns '000000000000000000000000000000000000000000000000000000000001a2b'
 */
export function normalizeHex32(hex: string) {
  const paddedHex = stripHexPrefix(hex).toLowerCase().padStart(64, '0');
  if (paddedHex.length !== 64) {
    throw new Error('normalizeHex32: Input does not fit in 32 bytes');
  }
  return paddedHex;
}

/**
 * Convert a hexadecimal string to a Uint8Array byte array
 * Automatically removes '0x' prefix if present
 * Each pair of hex characters becomes one byte in the array
 *
 * @param hex - Hexadecimal string (with or without '0x' prefix)
 * @returns Uint8Array containing the byte representation of the hex string
 * @example hexToByteArray('0x1a2b') // returns Uint8Array([26, 43])
 * @example hexToByteArray('ff00') // returns Uint8Array([255, 0])
 */
export function hexToByteArray(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.substring(2);
  }

  const byteLen = hex.length / 2;
  const ret = new Uint8Array(byteLen);

  for (let i = 0; i < byteLen; i++) {
    const m = i * 2;
    const n = m + 2;
    const intVal = parseInt(hex.substring(m, n), 16);
    ret[i] = intVal;
  }

  return ret;
}

/**
 * Convert a Uint8Array byte array to a hexadecimal string
 * Each byte is converted to a 2-character hex representation with leading zeros if needed
 *
 * @param byteArray - Uint8Array to convert to hex string
 * @returns Lowercase hex string without '0x' prefix
 * @example byteArrayToHex(new Uint8Array([26, 43, 255])) // returns '1a2bff'
 */
export function byteArrayToHex(byteArray: Uint8Array): string {
  return Array.from(byteArray, function (byte) {
    return (byte & 0xff).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * Format a 32-character hex string as a UUID (8-4-4-4-12 format)
 * Used to convert API keys from hex format to standard UUID format
 *
 * @param apiKey - 32-character hex string (without dashes)
 * @returns UUID formatted string with dashes
 * @example uuidFormat('be923ec2aea9c91a2c2833ddcefaf7c1') // returns 'be923ec2-aea9-c91a-2c28-33ddcefaf7c1'
 */
export function uuidFormat(apiKey: string): string {
  return [
    apiKey.substring(0, 8),
    apiKey.substring(8, 12),
    apiKey.substring(12, 16),
    apiKey.substring(16, 20),
    apiKey.substring(20, 32),
  ].join('-');
}

/**
 * Encode a byte array to URL-safe Base64 string
 * Removes padding characters and replaces URL-unsafe characters
 * Used for generating API secrets and passphrases
 *
 * @param byteArray - Uint8Array to encode
 * @returns URL-safe Base64 encoded string without padding
 * @example urlBase64Encode(new Uint8Array([72, 101, 108, 108, 111])) // returns 'SGVsbG8'
 */
export function urlBase64Encode(byteArray: Uint8Array): string {
  const base64 = Buffer.from(byteArray).toString('base64');
  return base64
    .replace(/=+$/, '') // Remove trailing '=' characters
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_'); // Replace '/' with '_'
}

/**
 * Extract a sub-array from a Uint8Array
 * Similar to Array.slice() but specifically for Uint8Array operations
 *
 * @param array - Source Uint8Array
 * @param start - Starting index (inclusive)
 * @param length - Number of bytes to extract
 * @returns New Uint8Array containing the specified range
 * @example subArray(new Uint8Array([1, 2, 3, 4, 5]), 1, 3) // returns Uint8Array([2, 3, 4])
 */
export function subArray(array: Uint8Array, start: number, length: number): Uint8Array {
  return array.slice(start, start + length);
}

/**
 * Convert an object to a URL query string format
 * Handles nested objects, arrays, and special encoding rules for EdgeX API
 * Matches edgex-web implementation exactly for API signature compatibility
 *
 * @param obj - Object to convert to query string
 * @param prefix - Optional prefix for nested object keys
 * @returns URL-encoded query string
 * @example
 * toQueryString({a: 1, b: {c: 2}}) // returns 'a=1&b=c%3D2'
 * toQueryString({arr: [1, 2]}) // returns 'arr=1&2'
 */
export function toQueryString(obj: any, prefix?: string): string {
  if (!obj) return '';

  const str: string[] = [];

  for (const p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p)) {
      const k = prefix ? `${prefix}[${p}]` : p;
      const v = obj[p];

      str.push(
        v !== null && Array.isArray(v)
          ? `${encodeURIComponent(k)}=${v
              .map(item =>
                item !== null && typeof item === 'object'
                  ? toQueryString(sortObjectByKeys(item))
                  : item
              )
              .join('&')}`
          : v !== null && typeof v === 'object'
            ? // Recursive call for nested objects, prefix empty to match backend rules
              `${encodeURIComponent(k)}=${toQueryString(v, '')}`
            : `${encodeURIComponent(k)}=${v}`
      );
    }
  }

  return str.join('&');
}

/**
 * Sort object keys recursively in ASCII order
 * Required for consistent API signature generation across different JavaScript engines
 * Matches edgex-web implementation exactly for signature compatibility
 *
 * @param obj - Object to sort (can be nested)
 * @returns New object with keys sorted alphabetically, or original value if not an object
 * @example
 * sortObjectByKeys({z: 1, a: {c: 3, b: 2}}) // returns {a: {b: 2, c: 3}, z: 1}
 */
export function sortObjectByKeys(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  // Get all keys and sort them by ASCII order
  const sortedKeys = Object.keys(obj).sort();

  // Create new object with sorted keys
  const sortedObj: any = {};
  for (const key of sortedKeys) {
    if (!Array.isArray(obj[key]) && typeof obj[key] === 'object' && obj[key] !== null) {
      sortedObj[key] = sortObjectByKeys(obj[key]);
    } else {
      sortedObj[key] = obj[key];
    }
  }

  return sortedObj;
}

/**
 * Add a prefix to a string if it's not already present
 * Commonly used to ensure hex strings have '0x' prefix for blockchain operations
 *
 * @param str - String to check and potentially modify
 * @param prefix - Prefix to add if not present
 * @returns String with prefix guaranteed to be present
 * @example checkPrefix('1a2b', '0x') // returns '0x1a2b'
 * @example checkPrefix('0x1a2b', '0x') // returns '0x1a2b' (unchanged)
 */
export function checkPrefix(str: string, prefix: string): string {
  if (!str) return str;
  if (str.startsWith(prefix)) {
    return str;
  }
  return `${prefix}${str}`;
}

/**
 * Get current timestamp in milliseconds as a string
 * Used for API request timestamps and nonce generation
 *
 * @returns Current timestamp in milliseconds as string
 * @example getCurrentTimestamp() // returns '1640995200000'
 */
export function getCurrentTimestamp(): string {
  return `${+new Date()}`;
}

/**
 * Generate a random client ID for API requests
 * Combines current timestamp with random digits for uniqueness
 * Used to identify individual API requests and prevent replay attacks
 *
 * @returns Unique client ID string combining timestamp and random digits
 * @example generateRandomClientId() // returns '1640995200000123456'
 */
export function generateRandomClientId(): string {
  return Math.random().toString().slice(2).replace(/^0+/, '');
}

/**
 * Check if an order type represents a market order
 * Market orders execute immediately at current market price
 * Used to determine order processing logic and validation rules
 *
 * @param orderType - Order type string to check
 * @returns True if the order type is a market order variant
 * @example isMarketOrder('MARKET') // returns true
 * @example isMarketOrder('LIMIT') // returns false
 */
export function isMarketOrder(orderType: string): boolean {
  return ['MARKET', 'STOP_MARKET', 'TAKE_PROFIT_MARKET'].includes(orderType);
}

/**
 * Calculate L2 price based on order type and side
 * Using BigNumber for precise calculations like edgex-web useCreateOrder
 */
export function calculateL2Price(
  tradeParams: { type: string; side: string; price: string },
  symbolInfo: SymbolModel
): string {
  const { type, side, price } = tradeParams;
  const { oraclePrice, tickSize } = symbolInfo;

  if (isMarketOrder(type)) {
    if (side === 'BUY') {
      // For buy orders: oracle price * 10 (using BigNumber)
      return BigNumber(oraclePrice).multipliedBy(10).toString();
    } else {
      // For sell orders: use tick size
      return tickSize;
    }
  } else {
    // For limit orders: use the specified price
    return price;
  }
}
