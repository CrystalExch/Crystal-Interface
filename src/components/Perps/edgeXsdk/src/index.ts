/**
 * EdgeX TypeScript SDK - Main Entry Point
 *
 * A comprehensive TypeScript SDK for the EdgeX trading platform
 * providing seamless integration with REST API services.
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

// Default export
export { EdgeXSDK as default } from './sdk';
