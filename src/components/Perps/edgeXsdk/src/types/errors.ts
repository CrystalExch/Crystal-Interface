/**
 * Error type definitions
 */

/**
 * Base EdgeX SDK error
 */
export class EdgeXError extends Error {
  public readonly code: string | number;
  public readonly details?: any;

  constructor(message: string, code: string | number = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'EdgeXError';
    this.code = code;
    this.details = details;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EdgeXError);
    }
  }
}

/**
 * API-related errors
 */
export class ApiError extends EdgeXError {
  constructor(message: string, code: string | number = 'API_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'ApiError';
  }
}

/**
 * Authentication-related errors
 */
export class AuthError extends EdgeXError {
  constructor(message: string, code: string | number = 'AUTH_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'AuthError';
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends EdgeXError {
  constructor(message: string, code: string | number = 'CONFIG_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'ConfigError';
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends EdgeXError {
  constructor(message: string, code: string | number = 'NETWORK_ERROR', details?: any) {
    super(message, code, details);
    this.name = 'NetworkError';
  }
}
