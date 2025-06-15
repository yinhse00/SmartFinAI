
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

// Re-export initialization function for manual use only
import { initializeSampleData } from './database/sampleData';
export { initializeSampleData };

// REMOVED: Automatic sample data initialization to prevent hardcoded data contamination
// The system now relies purely on existing Supabase data without hardcoded interference
console.log('Database service initialized - no automatic sample data population');

