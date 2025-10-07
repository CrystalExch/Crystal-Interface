/**
 * API-specific type definitions
 */

/**
 * Standard EdgeX API response wrapper
 */
export interface EdgeXApiResponse<T = unknown> {
  /** Response code (0 for success) */
  code: number;
  /** Response message */
  msg: string;
  /** Response data */
  data: T;
  /** Request timestamp */
  timestamp?: number;
}

/**
 * Authentication header generation request
 */
export interface AuthHeadersRequest {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Request body (optional) */
  body?: Record<string, unknown> | string | null;
  /** App name for header prefix (optional, default: 'EdgeX') */
  appName?: string;
}

/**
 * Authentication header generation response
 */
export interface AuthHeadersResponse {
  /** Generated authentication headers */
  headers: Record<string, string>;
  /** Timestamp used for signature */
  timestamp: number;
  /** Generated signature */
  signature: string;
}
