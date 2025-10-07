import {
  asEcKeyPair,
  asEcKeyPairPublic,
  asSimpleSignature,
  deserializeSignature,
  serializeSignature,
} from '../helpers';
import { sign, verify } from '../lib/crypto';
import { starkEc } from '../lib/starkware/crypto-js';
/**
 * Base class for a STARK key signable message.
 */
export class StarkSignable {
  constructor(message, networkId) {
    this._hashBN = null;
    this.message = message;
    this.networkId = networkId;
    // Sanity check.
    // if (!COLLATERAL_ASSET_ID_BY_NETWORK_ID()) {
    //   throw new Error(
    //     `Unknown network ID or unknown collateral asset for network: ${networkId}`
    //   );
    // }
  }
  /**
   * Return the message hash as a hex string, no 0x prefix.
   */
  async getHash() {
    return (await this.getHashBN()).toString(16).padStart(63, '0');
  }
  async getHashBN() {
    if (this._hashBN === null) {
      this._hashBN = await this.calculateHash();
    }
    return this._hashBN;
  }
  /**
   * Sign the message with the given private key, represented as a hex string or hex string pair.
   */
  async sign(privateKey) {
    const hashBN = await this.getHashBN();
    const ecSignature = await sign(asEcKeyPair(privateKey), hashBN);
    const res = serializeSignature(asSimpleSignature(ecSignature));
    return res;
  }
  /**
   * Verify the signature is valid for a given public key.
   */
  async verifySignature(signature, publicKey, publicKeyYCoordinate = null) {
    const signatureStruct = deserializeSignature(signature);
    // If y-coordinate is available, save time by using it, instead of having to infer it.
    if (publicKeyYCoordinate !== null) {
      const ecPublicKey = starkEc.keyFromPublic({
        x: publicKey,
        y: publicKeyYCoordinate,
      });
      return verify(ecPublicKey, await this.getHashBN(), signatureStruct);
    }
    // Return true if the signature is valid for either of the two possible y-coordinates.
    //
    // Compare with:
    // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L151
    const hashBN = await this.getHashBN();
    return (
      (await verify(asEcKeyPairPublic(publicKey, false), hashBN, signatureStruct)) ||
      verify(asEcKeyPairPublic(publicKey, true), hashBN, signatureStruct)
    );
  }
}
