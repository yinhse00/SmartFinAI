
import { grokService } from '../grokService';

export type TransactionType = 'M&A' | 'CAPITAL_RAISING' | 'HYBRID';

export interface TransactionClassification {
  type: TransactionType;
  confidence: number;
  reasoning: string;
  subType?: string; // e.g., 'rights_issue', 'open_offer', 'acquisition', 'merger'
  issuingCompany?: string; // For capital raising
  acquiringCompany?: string; // For M&A
  targetCompany?: string; // For M&A
}

/**
 * Service for classifying transaction types before detailed analysis
 */
export const transactionTypeClassifier = {
  /**
   * Classify transaction type using AI analysis
   */
  classifyTransaction: async (description: string, documentContent?: string): Promise<TransactionClassification> => {
    try {
      console.log('Classifying transaction type for:', description.substring(0, 100) + '...');
      
      const classificationPrompt = `
You are a Hong Kong capital markets expert. Analyze the following transaction description and classify it into one of three categories:

1. **M&A** - Mergers, acquisitions, takeovers (one company acquiring another)
2. **CAPITAL_RAISING** - Rights issues, open offers, IPOs (single company raising capital)
3. **HYBRID** - Combination transactions (e.g., acquisition funded by capital raising)

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `DOCUMENT CONTENT:\n${documentContent.substring(0, 1000)}...\n` : ''}

Provide your analysis as a JSON object with this exact structure:
{
  "type": "M&A" | "CAPITAL_RAISING" | "HYBRID",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification logic",
  "subType": "rights_issue|open_offer|ipo|acquisition|merger|takeover|hybrid_acquisition",
  "issuingCompany": "Company name for capital raising (if applicable)",
  "acquiringCompany": "Acquiring company name (if applicable)", 
  "targetCompany": "Target company name (if applicable)"
}

Classification guidelines:
- **M&A**: Keywords like "acquire", "acquisition", "merger", "takeover", "purchase", mentions of "% stake/shares", two distinct companies
- **CAPITAL_RAISING**: Keywords like "rights issue", "open offer", "IPO", "raise capital", "proceeds", single company focus
- **HYBRID**: Both M&A and capital raising elements present

Return ONLY the JSON object, no other text.`;

      const response = await grokService.generateResponse({
        prompt: classificationPrompt,
        metadata: {
          type: 'transaction_classification',
          stage: 'pre_analysis'
        }
      });

      let classification: TransactionClassification;

      try {
        // Extract JSON from response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
        const parsed = JSON.parse(jsonStr);
        
        classification = {
          type: parsed.type || 'M&A', // Default fallback
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || 'Classification based on keyword analysis',
          subType: parsed.subType,
          issuingCompany: parsed.issuingCompany,
          acquiringCompany: parsed.acquiringCompany,
          targetCompany: parsed.targetCompany
        };
        
      } catch (parseError) {
        console.error('Error parsing transaction classification:', parseError);
        // Fallback classification based on keywords
        classification = transactionTypeClassifier.createFallbackClassification(description);
      }

      console.log('Transaction classification result:', classification);
      return classification;
      
    } catch (error) {
      console.error('Error in transaction classification:', error);
      return transactionTypeClassifier.createFallbackClassification(description);
    }
  },

  /**
   * Create fallback classification based on keyword analysis
   */
  createFallbackClassification: (description: string): TransactionClassification => {
    const lowerDesc = description.toLowerCase();
    
    // Capital raising keywords
    const capitalRaisingKeywords = ['rights issue', 'open offer', 'ipo', 'raise capital', 'proceeds', 'subscription', 'allotment'];
    const hasCapitalRaising = capitalRaisingKeywords.some(keyword => lowerDesc.includes(keyword));
    
    // M&A keywords
    const maKeywords = ['acquire', 'acquisition', 'merger', 'takeover', 'purchase', '% stake', '% shares', 'buy'];
    const hasMaActivity = maKeywords.some(keyword => lowerDesc.includes(keyword));
    
    if (hasCapitalRaising && hasMaActivity) {
      return {
        type: 'HYBRID',
        confidence: 0.6,
        reasoning: 'Contains both capital raising and M&A keywords',
        subType: 'hybrid_acquisition'
      };
    } else if (hasCapitalRaising) {
      let subType = 'capital_raising';
      if (lowerDesc.includes('rights issue')) subType = 'rights_issue';
      else if (lowerDesc.includes('open offer')) subType = 'open_offer';
      else if (lowerDesc.includes('ipo')) subType = 'ipo';
      
      return {
        type: 'CAPITAL_RAISING',
        confidence: 0.7,
        reasoning: 'Contains capital raising keywords',
        subType
      };
    } else {
      let subType = 'acquisition';
      if (lowerDesc.includes('merger')) subType = 'merger';
      else if (lowerDesc.includes('takeover')) subType = 'takeover';
      
      return {
        type: 'M&A',
        confidence: 0.6,
        reasoning: 'Default to M&A classification',
        subType
      };
    }
  }
};
