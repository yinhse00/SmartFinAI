
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { CapitalRaisingContext } from '@/types/capitalRaising';

export class CapitalRaisingClassifier {
  static classifyCapitalRaisingType(
    description: string,
    results: AnalysisResults
  ): CapitalRaisingContext['type'] {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('rights issue') || lowerDesc.includes('rights offering')) {
      return 'rights_issue';
    } else if (lowerDesc.includes('open offer')) {
      return 'open_offer';
    } else if (lowerDesc.includes('placement') || lowerDesc.includes('private placement')) {
      return 'placement';
    } else if (lowerDesc.includes('subscription') || lowerDesc.includes('share subscription')) {
      return 'subscription';
    } else if (lowerDesc.includes('ipo') || lowerDesc.includes('initial public offering')) {
      return 'ipo';
    }
    
    // Fallback based on transaction type from results
    const transactionType = results.transactionType?.toLowerCase() || '';
    if (transactionType.includes('rights')) return 'rights_issue';
    if (transactionType.includes('open offer')) return 'open_offer';
    if (transactionType.includes('placement')) return 'placement';
    
    return 'rights_issue'; // Default fallback
  }

  static extractCapitalRaisingContext(
    description: string,
    results: AnalysisResults
  ): CapitalRaisingContext {
    const type = this.classifyCapitalRaisingType(description, results);
    
    // Extract issuing company name
    let issuingCompany = 'The Company';
    if (results.corporateStructure?.mainIssuer) {
      const issuerEntity = results.corporateStructure.entities?.find(
        e => e.id === results.corporateStructure.mainIssuer || e.name === results.corporateStructure.mainIssuer
      );
      if (issuerEntity) {
        issuingCompany = issuerEntity.name;
      } else {
        issuingCompany = results.corporateStructure.mainIssuer;
      }
    }
    
    // Extract financial details
    const proceedsAmount = results.dealEconomics?.purchasePrice || 0;
    const currency = results.dealEconomics?.currency || 'HKD';
    
    // Extract offer ratio from description
    const ratioMatch = description.match(/(\d+)\s+for\s+(\d+)/i);
    const offerRatio = ratioMatch ? `${ratioMatch[1]} for ${ratioMatch[2]}` : undefined;
    
    // Extract subscription price
    const priceMatch = description.match(/(?:hk\$|usd?\$|subscription price.*?)(\d+(?:\.\d+)?)/i);
    const subscriptionPrice = priceMatch ? parseFloat(priceMatch[1]) : undefined;
    
    // Extract discount
    const discountMatch = description.match(/(\d+(?:\.\d+)?)%\s*discount/i);
    const discount = discountMatch ? parseFloat(discountMatch[1]) : undefined;
    
    return {
      type,
      issuingCompany,
      offerRatio,
      subscriptionPrice,
      discount,
      proceedsAmount,
      currency
    };
  }
}
