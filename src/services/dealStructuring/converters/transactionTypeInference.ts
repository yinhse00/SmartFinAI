
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export class TransactionTypeInference {
  static inferTransactionTypeFromResults(results: AnalysisResults): 'M&A' | 'CAPITAL_RAISING' | 'HYBRID' {
    const transactionType = results.transactionType?.toLowerCase() || '';
    
    // Enhanced capital raising detection patterns
    const capitalRaisingKeywords = [
      'rights issue', 'open offer', 'ipo', 'initial public offering',
      'placement', 'subscription', 'issue', 'proceeds', 'raise', 'raising',
      'capital raising', 'fund raising', 'funding', 'allotment',
      'new shares', 'share issue', 'equity raising', 'share placement'
    ];
    
    const maKeywords = [
      'acquire', 'acquisition', 'merger', 'takeover', 'purchase',
      'buy', 'acquiring', 'target company', 'acquired'
    ];
    
    // Check for capital raising patterns
    const hasCapitalRaising = capitalRaisingKeywords.some(keyword => 
      transactionType.includes(keyword)
    );
    
    // Check for M&A patterns
    const hasMaActivity = maKeywords.some(keyword => 
      transactionType.includes(keyword)
    );
    
    // Check corporate structure for additional clues
    const hasTargetEntity = results.corporateStructure?.entities?.some(e => e.type === 'target');
    const hasIssuerEntity = results.corporateStructure?.entities?.some(e => e.type === 'issuer');
    
    // Check if shareholding data suggests capital raising (same shareholders, different percentages)
    const beforeShareholders = results.shareholding?.before || [];
    const afterShareholders = results.shareholding?.after || [];
    const sameShareholdersCount = beforeShareholders.length === afterShareholders.length;
    const hasNewInvestors = afterShareholders.some(sh => 
      sh.name.toLowerCase().includes('new') || sh.name.toLowerCase().includes('investor')
    );
    
    if (hasCapitalRaising || (hasIssuerEntity && !hasTargetEntity) || 
        (sameShareholdersCount && hasNewInvestors)) {
      return 'CAPITAL_RAISING';
    }
    
    if (hasMaActivity || hasTargetEntity) {
      return 'M&A';
    }
    
    if (hasCapitalRaising && hasMaActivity) {
      return 'HYBRID';
    }
    
    // Default to M&A only if there's clear evidence
    return hasTargetEntity ? 'M&A' : 'CAPITAL_RAISING';
  }
}
