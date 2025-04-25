
import { analyzeFinancialResponse as analyzeResponse } from './financialResponseAnalyzer';

/**
 * Analyzes financial responses to check for completeness
 * 
 * @param content The response content to analyze
 * @param queryType The type of financial query
 * @returns Analysis result with completeness status and missing elements
 */
export function analyzeFinancialResponse(content: string, queryType: string) {
  // Forward to the main implementation in the financialResponseAnalyzer module
  return analyzeResponse(content, queryType);
}
