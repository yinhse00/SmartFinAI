
/**
 * Utilities for working with regulatory categories
 */

import { RegulatoryEntry } from "./types";

/**
 * Helper function to determine category from filename
 */
export function determineCategory(filename: string): RegulatoryEntry['category'] {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('listing') || lowerFilename.includes('listing rules')) {
    return 'listing_rules';
  }
  
  if (lowerFilename.includes('takeover') || lowerFilename.includes('takeovers')) {
    return 'takeovers';
  }
  
  if (lowerFilename.includes('guidance') || lowerFilename.includes('note')) {
    return 'guidance';
  }
  
  if (lowerFilename.includes('precedent') || lowerFilename.includes('case')) {
    return 'precedents';
  }
  
  return 'other';
}

