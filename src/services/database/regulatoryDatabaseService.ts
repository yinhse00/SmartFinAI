
// Main entry point file that re-exports all services
import { RegulationProvision, RegulationCategory, RegulationDefinition } from './types';
import { categoryService } from './services/categoryService';
import { provisionService } from './services/provisionService';
import { definitionService } from './services/definitionService';
import { searchService } from './services/searchService';
import { statsService } from './services/statsService';

// Re-export types
export type { 
  RegulationProvision,
  RegulationCategory,
  RegulationDefinition
};

/**
 * Combined service for regulatory database operations
 */
export const regulatoryDatabaseService = {
  // Category operations
  getCategories: categoryService.getCategories,
  getCategoryIdByCode: categoryService.getCategoryIdByCode,
  
  // Provision operations
  getProvisionsByChapter: provisionService.getProvisionsByChapter,
  addProvision: provisionService.addProvision,
  addProvisions: provisionService.addProvisions,
  getProvisionsBySourceDocument: provisionService.getProvisionsBySourceDocument,
  
  // Definition operations
  addDefinition: definitionService.addDefinition,
  searchDefinitions: definitionService.searchDefinitions,
  
  // Search operations
  searchProvisions: searchService.searchProvisions,
  
  // Stats operations
  getDatabaseStats: statsService.getDatabaseStats
};
