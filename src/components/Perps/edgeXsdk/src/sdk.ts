import type { EdgeXConfig, Metadata } from './types/config';
import {
  createAuthHeaders,
  generateTradeParams,
  generateETHWithdrawParams,
  generateCrossWithdrawParams,
} from './auth/headers';
import { generateApiKeyFromSignature, generateL2KeyPairFromSignature } from './auth/keystore';
import type {
  CreateAuthHeadersParams,
  AuthHeaders,
  GenerateTradeParamsInput,
  GenerateTradeParamsOutput,
  ETHWithdrawInput,
  ETHWithdrawOutput,
  CrossWithdrawInput,
  CrossWithdrawOutput,
  ApiKeyData,
  L2KeyPair,
} from './types/auth';
import metadataManager from './starkex-lib/metadata-manager';

export class EdgeXSDK {
  private static instance: EdgeXSDK | null = null;
  private config: EdgeXConfig;
  private apiKeys?: ApiKeyData;
  private l2KeyPair?: L2KeyPair;

  constructor(config: EdgeXConfig = {}) {
    this.config = config;

    if (config.metadata) {
      metadataManager.setMetadata(config.metadata);
    }
  }

  static getInstance(config?: EdgeXConfig): EdgeXSDK {
    if (!EdgeXSDK.instance) {
      EdgeXSDK.instance = new EdgeXSDK(config);
    }
    return EdgeXSDK.instance;
  }

  static resetInstance(): void {
    EdgeXSDK.instance = null;
  }

  setMetadata(metadata: Metadata): void {
    this.config.metadata = metadata;
    metadataManager.setMetadata(metadata);
  }

  getMetadata(): Metadata | null {
    return metadataManager.getMetadata();
  }

  hasMetadata(): boolean {
    return metadataManager.hasMetadata();
  }

  setApiKeys(apiKeys: ApiKeyData): void {
    this.apiKeys = apiKeys;
  }

  getApiKeys(): ApiKeyData | undefined {
    return this.apiKeys;
  }

  setL2KeyPair(l2KeyPair: L2KeyPair): void {
    this.l2KeyPair = l2KeyPair;
  }

  getL2KeyPair(): L2KeyPair | undefined {
    return this.l2KeyPair;
  }

  generateApiKeyFromSignature(signature: string): ApiKeyData {
    const apiKeys = generateApiKeyFromSignature(signature);
    this.apiKeys = apiKeys;
    return apiKeys;
  }

  generateL2KeyPairFromSignature(signature: string): L2KeyPair {
    const l2KeyPair = generateL2KeyPairFromSignature(signature);
    this.l2KeyPair = l2KeyPair;
    return l2KeyPair;
  }

  createAuthHeaders(
    params: Omit<CreateAuthHeadersParams, 'apiKey' | 'apiSecret' | 'passphrase'>
  ): AuthHeaders {
    if (!this.apiKeys) {
      throw new Error('API keys not set. Call generateApiKeyFromSignature() first.');
    }

    return createAuthHeaders({
      ...params,
      apiKey: this.apiKeys.apiKey,
      apiSecret: this.apiKeys.apiSecret,
      passphrase: this.apiKeys.apiPassphrase,
    });
  }

  async generateTradeParams(
    input: Omit<GenerateTradeParamsInput, 'apiKeys' | 'l2KeyPair'>
  ): Promise<GenerateTradeParamsOutput> {
    if (!this.apiKeys || !this.l2KeyPair) {
      throw new Error(
        'API keys and L2 key pair not set. Call generateApiKeyFromSignature() and generateL2KeyPairFromSignature() first.'
      );
    }

    return generateTradeParams({
      ...input,
      apiKeys: this.apiKeys,
      l2KeyPair: this.l2KeyPair,
    });
  }

  async generateETHWithdrawParams(
    input: ETHWithdrawInput,
    networkId: number,
    requestPath?: string,
    requestMethod?: string,
    timestamp?: string
  ): Promise<ETHWithdrawOutput> {
    if (!this.apiKeys || !this.l2KeyPair) {
      throw new Error(
        'API keys and L2 key pair not set. Call generateApiKeyFromSignature() and generateL2KeyPairFromSignature() first.'
      );
    }

    return generateETHWithdrawParams(
      input,
      this.apiKeys,
      this.l2KeyPair,
      networkId,
      requestPath,
      requestMethod,
      timestamp
    );
  }

  async generateCrossWithdrawParams(
    input: CrossWithdrawInput,
    networkId: number,
    requestPath?: string,
    requestMethod?: string,
    timestamp?: string
  ): Promise<CrossWithdrawOutput> {
    if (!this.apiKeys || !this.l2KeyPair) {
      throw new Error(
        'API keys and L2 key pair not set. Call generateApiKeyFromSignature() and generateL2KeyPairFromSignature() first.'
      );
    }

    return generateCrossWithdrawParams(
      input,
      this.apiKeys,
      this.l2KeyPair,
      networkId,
      requestPath,
      requestMethod,
      timestamp
    );
  }
}
