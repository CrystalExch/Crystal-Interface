/**
 * EdgeX TypeScript SDK - Browser Entry Point
 *
 * Browser-optimized version with viem keccak256 and js-sha256 support
 */

// Main SDK exports
export { EdgeXSDK } from './sdk';

// Type exports
export type * from './types';

// Authentication utilities
export * from './auth';

// Error classes
export * from './types/errors';

// Version
export const VERSION = '1.0.0';

// Default export for browser global
export { EdgeXSDK as default } from './sdk';
