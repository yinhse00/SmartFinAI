
/**
 * Exports all database functionality from refactored services
 */

// Re-export types with proper syntax for isolatedModules
export type { RegulatoryEntry } from './database/types';

// Re-export main services
export { databaseService } from './database/databaseService';
export { searchService } from './database/search';

// Re-export utilities
export { determineCategory } from './database/categoryUtils';

// Re-export initialization
import { initializeSampleData } from './database/sampleData';
export { initializeSampleData };

// Initialize sample data when importing this file
initializeSampleData();
