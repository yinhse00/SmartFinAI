
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ShareholderAnalysis } from '@/types/capitalRaising';

export class ShareholderAnalyzer {
  static analyzeShareholderStructure(results: AnalysisResults): ShareholderAnalysis {
    const beforeShareholders = results.shareholding?.before || [];
    
    // Identify controlling shareholder (largest shareholder above 30%)
    let controllingShareholderName: string | undefined;
    let controllingPercentage: number | undefined;
    
    const sortedShareholders = [...beforeShareholders].sort((a, b) => b.percentage - a.percentage);
    const largestShareholder = sortedShareholders[0];
    
    if (largestShareholder && largestShareholder.percentage > 30) {
      controllingShareholderName = largestShareholder.name;
      controllingPercentage = largestShareholder.percentage;
    }
    
    // Extract public shareholders (excluding controlling shareholder)
    const publicShareholders = beforeShareholders
      .filter(sh => sh.name !== controllingShareholderName)
      .map(sh => ({
        name: sh.name,
        percentage: sh.percentage,
        type: this.inferShareholderType(sh.name) as 'institutional' | 'individual' | 'fund'
      }));
    
    // Check if controlling shareholder might be underwriter
    const isControllingShareholderUnderwriter = this.detectUnderwriterRole(
      controllingShareholderName,
      results
    );
    
    return {
      controllingShareholderName,
      controllingPercentage,
      publicShareholders,
      isControllingShareholderUnderwriter
    };
  }
  
  private static inferShareholderType(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('fund') || lowerName.includes('capital') || lowerName.includes('investment')) {
      return 'fund';
    } else if (lowerName.includes('ltd') || lowerName.includes('limited') || lowerName.includes('corporation') || lowerName.includes('inc')) {
      return 'institutional';
    } else if (lowerName.includes('public') || lowerName.includes('other')) {
      return 'institutional';
    }
    
    return 'individual';
  }
  
  private static detectUnderwriterRole(
    controllingShareholderName: string | undefined,
    results: AnalysisResults
  ): boolean {
    if (!controllingShareholderName) return false;
    
    // Check transaction description for underwriting mentions
    const transactionType = results.transactionType?.toLowerCase() || '';
    const structureDesc = results.structure?.rationale?.toLowerCase() || '';
    
    return (
      transactionType.includes('underwrite') ||
      structureDesc.includes('underwrite') ||
      transactionType.includes(controllingShareholderName.toLowerCase() + ' subscribe')
    );
  }
}
