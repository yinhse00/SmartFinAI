
// This file should be a simple re-export without creating circular dependency

// Import from the actual implementation file
import { analyzeFinancialResponse as analyzeFinancialResponseImpl } from './financialResponseAnalyzer/index';

// Re-export with the same name
export const analyzeFinancialResponse = analyzeFinancialResponseImpl;
