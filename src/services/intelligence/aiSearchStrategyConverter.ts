
import { AiSearchStrategy, QueryAnalysis } from './queryIntelligenceService';

/**
 * Converts AiSearchStrategy to QueryAnalysis for consistent typing across workflow steps.
 * Avoids injecting hardcoded values.
 */
export function aiSearchStrategyToQueryAnalysis(aiStrategy: AiSearchStrategy): QueryAnalysis {
  // Compose QueryAnalysis from what's available in AiSearchStrategy
  return {
    categories: aiStrategy.categories || ['general'],
    targetParty: 'both', // Fallback since AiSearchStrategy does not provide this
    intent: aiStrategy.intent || 'general',
    relevantTables: aiStrategy.prioritizedTables || [],
    keywords: aiStrategy.keywords || [],
    confidence: 0.9, // Assume AI context means high confidence
  };
}
