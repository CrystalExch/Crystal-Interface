/**
 * API Client type definitions
 */

import { EdgeXKeystore } from './auth';

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data: T;
  /** Response status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  /** Error code */
  code: string | number;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
}

/**
 * Request configuration for API calls
 */
export interface RequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** Request URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request parameters (for GET) or body (for POST/PUT) */
  data?: any;
  /** Request timeout */
  timeout?: number;
}

/**
 * API Client interface
 */
export interface ApiClient {
  /** Set keystore for authentication */
  setKeystore(keystore: EdgeXKeystore): void;

  /** Get current keystore */
  getKeystore(): EdgeXKeystore | undefined;

  /** Generate keystore from wallet signatures */
  generateKeystore(apiSignature: string, starkSignature: string): EdgeXKeystore;

  /** Make authenticated API request */
  request<T = any>(config: RequestConfig): Promise<ApiResponse<T>>;
}
