
/**
 * Exports all database functionality from refactored services
 */

// Re-export types with proper syntax for isolatedModules
export type { RegulatoryEntry } from './database/types';

// Re-export main services
export { databaseService } from './database/databaseService';
export { searchService } from './database/searchService';

// Re-export utilities
export { determineCategory } from './database/categoryUtils';

// Re-export initialization
import { initializeSampleData } from './database/sampleData';
export { initializeSampleData };

// Initialize sample data when importing this file
// This will now check if data exists in Supabase first and only add sample data if database is empty
initializeSampleData().catch(error => {
  console.warn('Sample data initialization failed:', error);
});
