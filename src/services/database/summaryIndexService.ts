
import { RegulatoryEntry } from './types';
import { summaryIndexCore } from './summaryIndex/core';
import { summarySearchOperations } from './summaryIndex/search';
import { SearchResult, SummarySearchOptions } from './summaryIndex/types';

/**
 * Service for summary and keyword index operations
 */
export const summaryIndexService = {
  ...summaryIndexCore,
  ...summarySearchOperations
};

// Re-export types
export type { SearchResult, SummarySearchOptions };

