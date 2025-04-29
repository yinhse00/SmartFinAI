
/**
 * Utility functions for creating deterministic hashes
 */
export const hashUtils = {
  /**
   * Creates a simple deterministic hash from text
   */
  createSimpleHash: (text: string): number => {
    let hash = 0;
    if (!text || text.length === 0) return hash;
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash);
  }
};
