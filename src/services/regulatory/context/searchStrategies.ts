
/**
 * @deprecated This module only exists for backward compatibility.
 * Please use the dedicated service files directly:
 * - faqSearchService.ts
 * - specificRuleSearchService.ts
 * - takeoversSearchService.ts
 * - tradingArrangementsService.ts
 * - aggregationSearchService.ts
 * - fallbackService.ts
 * - contextSearchOrchestrator.ts
 */

// Re-export functionality from service files for backward compatibility
import { findFAQDocuments } from './faqSearchService';
import { specificRuleSearchService } from './specificRuleSearchService';
import { takeoversSearchService } from './takeoversSearchService';
import { tradingArrangementsService } from './tradingArrangementsService';
import { fallbackService } from './fallbackService';

/**
 * @deprecated Use specialized service files instead
 */
export const searchStrategies = {
  findFAQDocuments,
  findSpecificRulesDocuments: specificRuleSearchService.findSpecificRulesDocuments,
  findGeneralOfferDocuments: takeoversSearchService.findGeneralOfferDocuments,
  findTradingArrangementDocuments: tradingArrangementsService.findTradingArrangementDocuments,
  findTimetableDocuments: tradingArrangementsService.findTimetableDocuments,
  addFallbackDocumentsIfNeeded: fallbackService.addFallbackDocumentsIfNeeded
};
