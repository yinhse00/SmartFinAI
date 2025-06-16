
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export class TransactionTypeInference {
  static inferTransactionTypeFromResults(results: AnalysisResults): 'M&A' | 'CAPITAL_RAISING' | 'HYBRID' {
    const transactionType = results.transactionType?.toLowerCase() || '';
    
    if (transactionType.includes('rights issue') || transactionType.includes('open offer') || transactionType.includes('capital raising')) {
      return 'CAPITAL_RAISING';
    }
    
    if (transactionType.includes('acquire') || transactionType.includes('merger') || transactionType.includes('takeover')) {
      return 'M&A';
    }
    
    return 'M&A'; // Default fallback
  }
}
