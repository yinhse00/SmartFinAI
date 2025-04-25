
/**
 * Exports all database functionality from refactored services
 */

// Re-export types with proper syntax for isolatedModules
export type { RegulatoryEntry } from './database/types';
export type { SearchResults, SearchOptions } from './database/search/types';

// Re-export main services
export { databaseService } from './database/databaseService';
export { searchService } from './database/search/searchService';
export { referenceSearchService } from './database/search/referenceSearchService';
export { faqSearchService } from './database/search/faqSearchService';

// Re-export utilities
export { determineCategory } from './database/categoryUtils';
export { 
  extractKeyTerms, 
  calculateRelevanceScore, 
  hasFuzzyMatch 
} from './database/utils/textProcessing';

// Re-export initialization
import { initializeSampleData } from './database/sampleData';
export { initializeSampleData };

// Initialize sample data when importing this file
initializeSampleData();
