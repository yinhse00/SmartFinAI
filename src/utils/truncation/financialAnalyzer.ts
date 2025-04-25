
/**
 * This file is meant to be the entry point for financial analysis,
 * keeping it separate from the implementation to avoid circular dependencies
 */

// Import the implementation directly
import { analyzeFinancialResponse as analyzeFinancialResponseImpl } from './financialResponseAnalyzer/index';

/**
 * Analyzes financial responses to check for completeness
 * 
 * @param content The response content to analyze
 * @param queryType The type of financial query
 * @returns Analysis result with completeness status and missing elements
 */
export function analyzeFinancialResponse(content: string, queryType: string) {
  // Forward to the implementation without creating a circular reference
  return analyzeFinancialResponseImpl(content, queryType);
}
