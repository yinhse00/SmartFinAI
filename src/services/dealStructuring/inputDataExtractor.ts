
import { TransactionAnalysisRequest } from './aiAnalysisService';

export interface ExtractedInputData {
  considerationAmount?: number;
  currency?: string;
  acquisitionPercentage?: number;
  targetCompanyName?: string;
  acquiringCompanyName?: string;
  shareholderStructure?: Array<{
    name: string;
    percentage: number;
    type: 'before' | 'after';
  }>;
  transactionType?: string;
}

export class InputDataExtractor {
  extractStructuredData(request: TransactionAnalysisRequest): ExtractedInputData {
    const description = request.description.toLowerCase();
    const extracted: ExtractedInputData = {};

    // Extract consideration amount
    const amountMatches = [
      request.description.match(/(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(?:million|m)/i),
      request.description.match(/(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)\s*(?:billion|b)/i),
      request.description.match(/(?:hk\$|hkd|hong kong dollars?)\s*([\d,]+(?:\.\d+)?)/i),
      request.description.match(/([\d,]+(?:\.\d+)?)\s*(?:million|m)\s*(?:hk\$|hkd|hong kong dollars?)/i)
    ];

    for (const match of amountMatches) {
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (description.includes('million') || description.includes(' m ')) {
          extracted.considerationAmount = amount * 1000000;
        } else if (description.includes('billion') || description.includes(' b ')) {
          extracted.considerationAmount = amount * 1000000000;
        } else {
          extracted.considerationAmount = amount;
        }
        break;
      }
    }

    // Extract acquisition percentage
    const percentageMatch = request.description.match(/(?:acquire|purchase|buy|obtaining?)\s+(?:a\s+)?(\d+(?:\.\d+)?)%/i);
    if (percentageMatch) {
      extracted.acquisitionPercentage = parseFloat(percentageMatch[1]);
    }

    // Extract currency
    if (description.includes('hk$') || description.includes('hkd') || description.includes('hong kong dollar')) {
      extracted.currency = 'HKD';
    } else if (description.includes('usd') || description.includes('us$')) {
      extracted.currency = 'USD';
    }

    // Extract transaction type
    if (description.includes('acquisition') || description.includes('acquire')) {
      extracted.transactionType = 'Acquisition';
    } else if (description.includes('merger')) {
      extracted.transactionType = 'Merger';
    } else if (description.includes('takeover')) {
      extracted.transactionType = 'Takeover';
    } else if (description.includes('investment')) {
      extracted.transactionType = 'Investment';
    }

    // Extract company names (basic pattern matching)
    const companyMatches = request.description.match(/(?:company|corp|ltd|limited|inc)\s*[A-Z][^.!?]*?(?=\s+(?:will|plans|intends|seeks|wants))/gi);
    if (companyMatches && companyMatches.length >= 1) {
      extracted.acquiringCompanyName = companyMatches[0].trim();
    }

    const targetMatches = request.description.match(/(?:target|acquire|purchase|buy)\s+([A-Z][A-Za-z\s&]+?(?:company|corp|ltd|limited|inc))/i);
    if (targetMatches) {
      extracted.targetCompanyName = targetMatches[1].trim();
    }

    return extracted;
  }

  validateExtraction(extracted: ExtractedInputData): {
    isValid: boolean;
    missingFields: string[];
    confidence: number;
  } {
    const missingFields: string[] = [];
    let fieldCount = 0;
    let presentCount = 0;

    const checkField = (field: any, name: string) => {
      fieldCount++;
      if (field !== undefined && field !== null && field !== '') {
        presentCount++;
      } else {
        missingFields.push(name);
      }
    };

    checkField(extracted.considerationAmount, 'consideration amount');
    checkField(extracted.acquisitionPercentage, 'acquisition percentage');
    checkField(extracted.targetCompanyName, 'target company name');
    checkField(extracted.acquiringCompanyName, 'acquiring company name');

    const confidence = presentCount / fieldCount;
    const isValid = confidence >= 0.5; // At least 50% of key fields extracted

    return {
      isValid,
      missingFields,
      confidence
    };
  }
}

export const inputDataExtractor = new InputDataExtractor();
