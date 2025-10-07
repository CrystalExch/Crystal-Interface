import type { Metadata } from '../types/config';

/**
 * Metadata manager for StarkEx operations
 */
class MetadataManager {
  private metadata: Metadata | null = null;

  /**
   * Set the metadata configuration
   */
  setMetadata(metadata: Metadata): void {
    this.metadata = metadata;
  }

  /**
   * Get the current metadata
   */
  getMetadata(): Metadata | null {
    return this.metadata;
  }

  /**
   * Get state in the same format as the original mock interface
   * This maintains compatibility with existing code
   */
  getState(): { metadata: Metadata | null } {
    return {
      metadata: this.metadata,
    };
  }

  /**
   * Check if metadata is available
   */
  hasMetadata(): boolean {
    return this.metadata !== null;
  }

  /**
   * Clear the metadata
   */
  clearMetadata(): void {
    this.metadata = null;
  }
}

// Create a singleton instance
const metadataManager = new MetadataManager();

export default metadataManager;

// Also export the class for testing purposes
export { MetadataManager };
