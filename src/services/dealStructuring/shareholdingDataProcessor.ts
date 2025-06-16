
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export interface ProcessedShareholdingData {
  before: Array<{
    name: string;
    percentage: number;
    description: string;
  }>;
  after: Array<{
    name: string;
    percentage: number;
    description: string;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'new' | 'unchanged';
  }>;
  impactDescription: string;
}

export class ShareholdingDataProcessor {
  /**
   * Process shareholding data based on transaction type
   */
  static processShareholdingData(
    results: AnalysisResults,
    transactionType: 'M&A' | 'CAPITAL_RAISING' | 'HYBRID' = 'M&A'
  ): ProcessedShareholdingData {
    const beforeShareholders = results.shareholding?.before || [];
    const afterShareholders = results.shareholding?.after || [];
    
    if (transactionType === 'CAPITAL_RAISING') {
      return this.processCapitalRaisingData(beforeShareholders, afterShareholders, results);
    } else {
      return this.processMaData(beforeShareholders, afterShareholders, results);
    }
  }

  /**
   * Process M&A transaction data - show acquisition stakes clearly
   */
  private static processMaData(
    beforeShareholders: any[],
    afterShareholders: any[],
    results: AnalysisResults
  ): ProcessedShareholdingData {
    // For M&A, show clear before/after without consolidation
    const processedBefore = beforeShareholders.map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `Current shareholder with ${sh.percentage}% stake`
    }));

    const processedAfter = afterShareholders.map(sh => {
      const beforeSh = beforeShareholders.find(b => b.name === sh.name);
      const beforePercentage = beforeSh?.percentage || 0;
      const change = sh.percentage - beforePercentage;
      
      let description: string;
      let changeType: 'increase' | 'decrease' | 'new' | 'unchanged';
      
      if (beforePercentage === 0) {
        description = `New shareholder acquiring ${sh.percentage}% stake`;
        changeType = 'new';
      } else if (change > 0) {
        description = `Increases stake from ${beforePercentage}% to ${sh.percentage}%`;
        changeType = 'increase';
      } else if (change < 0) {
        description = `Reduces stake from ${beforePercentage}% to ${sh.percentage}%`;
        changeType = 'decrease';
      } else {
        description = `Maintains ${sh.percentage}% stake`;
        changeType = 'unchanged';
      }

      return {
        name: sh.name,
        percentage: sh.percentage,
        description,
        change: Math.abs(change),
        changeType
      };
    });

    return {
      before: processedBefore,
      after: processedAfter,
      impactDescription: results.shareholding?.impact || 'Acquisition will result in changes to ownership structure and control.'
    };
  }

  /**
   * Process capital raising data - apply consolidation for controlling shareholder
   */
  private static processCapitalRaisingData(
    beforeShareholders: any[],
    afterShareholders: any[],
    results: AnalysisResults
  ): ProcessedShareholdingData {
    // For capital raising, apply the existing consolidation logic
    const processedBefore = beforeShareholders.map(sh => ({
      name: sh.name,
      percentage: sh.percentage,
      description: `Current shareholder with ${sh.percentage}% ownership`
    }));

    // Apply consolidation logic for controlling shareholder
    const processedAfter = afterShareholders.map(sh => {
      const beforeSh = beforeShareholders.find(b => b.name === sh.name);
      const beforePercentage = beforeSh?.percentage || 0;
      const change = sh.percentage - beforePercentage;
      
      let description: string;
      let changeType: 'increase' | 'decrease' | 'new' | 'unchanged';
      
      if (beforePercentage === 0) {
        description = `New shareholder with ${sh.percentage}% ownership`;
        changeType = 'new';
      } else if (change > 0) {
        description = `Existing + new shares totaling ${sh.percentage}% (${beforePercentage}% + ${change.toFixed(1)}%)`;
        changeType = 'increase';
      } else if (change < 0) {
        description = `Diluted from ${beforePercentage}% to ${sh.percentage}%`;
        changeType = 'decrease';
      } else {
        description = `Maintains ${sh.percentage}% ownership`;
        changeType = 'unchanged';
      }

      return {
        name: sh.name,
        percentage: sh.percentage,
        description,
        change: Math.abs(change),
        changeType
      };
    });

    return {
      before: processedBefore,
      after: processedAfter,
      impactDescription: results.shareholding?.impact || 'Capital raising will affect ownership percentages and control structure.'
    };
  }

  /**
   * Determine transaction type from analysis results
   */
  static inferTransactionType(results: AnalysisResults): 'M&A' | 'CAPITAL_RAISING' | 'HYBRID' {
    const transactionType = results.transactionType?.toLowerCase() || '';
    
    const capitalRaisingKeywords = [
      'rights issue', 'open offer', 'ipo', 'placement', 'subscription',
      'capital raising', 'fund raising', 'proceeds', 'allotment'
    ];
    
    const maKeywords = [
      'acquire', 'acquisition', 'merger', 'takeover', 'purchase', 'buy'
    ];
    
    const hasCapitalRaising = capitalRaisingKeywords.some(keyword => 
      transactionType.includes(keyword)
    );
    
    const hasMaActivity = maKeywords.some(keyword => 
      transactionType.includes(keyword)
    );
    
    if (hasCapitalRaising && hasMaActivity) {
      return 'HYBRID';
    } else if (hasCapitalRaising) {
      return 'CAPITAL_RAISING';
    } else {
      return 'M&A';
    }
  }
}
