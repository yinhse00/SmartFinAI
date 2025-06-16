
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionType } from './transactionTypeClassifier';

export interface TypeSpecificEntityNames {
  transactionType: TransactionType;
  // M&A specific
  acquiringCompanyName?: string;
  targetCompanyName?: string;
  isAcquirerListed?: boolean;
  // Capital raising specific
  issuingCompanyName?: string;
  isIssuerListed?: boolean;
  // Common
  primaryCompanyName: string;
  secondaryCompanyName?: string;
}

/**
 * Extract entity names based on transaction type
 */
export const typeSpecificEntityExtractor = {
  /**
   * Extract entities based on transaction type
   */
  extractEntitiesForType: (
    results: AnalysisResults,
    transactionType: TransactionType
  ): TypeSpecificEntityNames => {
    console.log(`Extracting entities for transaction type: ${transactionType}`);
    
    switch (transactionType) {
      case 'M&A':
        return typeSpecificEntityExtractor.extractMaEntities(results);
      case 'CAPITAL_RAISING':
        return typeSpecificEntityExtractor.extractCapitalRaisingEntities(results);
      case 'HYBRID':
        return typeSpecificEntityExtractor.extractHybridEntities(results);
      default:
        return typeSpecificEntityExtractor.extractMaEntities(results);
    }
  },

  /**
   * Extract entities for M&A transactions
   */
  extractMaEntities: (results: AnalysisResults): TypeSpecificEntityNames => {
    let acquiringCompanyName = 'Acquiring Company';
    let targetCompanyName = 'Target Company';
    let isAcquirerListed = false;

    // Extract target company
    const targetEntity = results.corporateStructure?.entities?.find(e => e.type === 'target');
    if (targetEntity) {
      targetCompanyName = targetEntity.name;
    } else if (results.corporateStructure?.targetEntities && results.corporateStructure.targetEntities.length > 0) {
      targetCompanyName = results.corporateStructure.targetEntities[0];
    }

    // Extract acquiring company
    if (results.corporateStructure?.mainIssuer) {
      const issuerEntity = results.corporateStructure.entities?.find(
        e => (e.id === results.corporateStructure.mainIssuer || e.name === results.corporateStructure.mainIssuer) 
        && e.name !== targetCompanyName
      );
      if (issuerEntity) {
        acquiringCompanyName = issuerEntity.name;
        isAcquirerListed = true;
      }
    }

    // Check transaction type for explicit patterns
    if (results.transactionType === "Listed Company acquires Target Company") {
      acquiringCompanyName = "Listed Company";
      isAcquirerListed = true;
    }

    console.log('M&A entities extracted:', { acquiringCompanyName, targetCompanyName, isAcquirerListed });

    return {
      transactionType: 'M&A',
      acquiringCompanyName,
      targetCompanyName,
      isAcquirerListed,
      primaryCompanyName: acquiringCompanyName,
      secondaryCompanyName: targetCompanyName
    };
  },

  /**
   * Extract entities for capital raising transactions
   */
  extractCapitalRaisingEntities: (results: AnalysisResults): TypeSpecificEntityNames => {
    let issuingCompanyName = 'Issuing Company';
    let isIssuerListed = true; // Capital raising typically by listed companies

    // Extract issuing company from corporate structure
    if (results.corporateStructure?.mainIssuer) {
      const issuerEntity = results.corporateStructure.entities?.find(
        e => e.id === results.corporateStructure.mainIssuer || e.name === results.corporateStructure.mainIssuer
      );
      if (issuerEntity) {
        issuingCompanyName = issuerEntity.name;
      } else {
        issuingCompanyName = results.corporateStructure.mainIssuer;
      }
    }

    // Check if any entity is marked as issuer
    const issuerEntity = results.corporateStructure?.entities?.find(e => e.type === 'issuer');
    if (issuerEntity) {
      issuingCompanyName = issuerEntity.name;
    }

    // Extract from transaction type patterns - enhanced patterns
    const typePatterns = [
      /^(.+?)\s+(?:rights issue|open offer|raises capital|ipo|placement|subscription)/i,
      /^(.+?)\s+(?:conducts|announces|launches)\s+(?:rights issue|open offer|capital raising)/i,
      /^(.+?)\s+(?:issues|raises|places)\s+(?:new shares|equity|capital)/i,
      /(?:rights issue|open offer|capital raising|ipo)\s+by\s+(.+?)(?:\s|$)/i
    ];

    for (const pattern of typePatterns) {
      const match = results.transactionType?.match(pattern);
      if (match && match[1]) {
        issuingCompanyName = match[1].trim();
        break;
      }
    }

    // If we have shareholding data, try to extract company name from context
    if (issuingCompanyName === 'Issuing Company' && results.shareholding?.before?.length > 0) {
      // Look for company-related context in the transaction description
      const description = results.transactionType || '';
      const companyMatch = description.match(/([A-Z][a-zA-Z\s&]+(?:Limited|Ltd|Company|Corp|Inc))/);
      if (companyMatch) {
        issuingCompanyName = companyMatch[1].trim();
      }
    }

    console.log('Capital raising entities extracted:', { issuingCompanyName, isIssuerListed });

    return {
      transactionType: 'CAPITAL_RAISING',
      issuingCompanyName,
      isIssuerListed,
      primaryCompanyName: issuingCompanyName
    };
  },

  /**
   * Extract entities for hybrid transactions
   */
  extractHybridEntities: (results: AnalysisResults): TypeSpecificEntityNames => {
    // For hybrid transactions, we need both M&A and capital raising entities
    const maEntities = typeSpecificEntityExtractor.extractMaEntities(results);
    const capitalEntities = typeSpecificEntityExtractor.extractCapitalRaisingEntities(results);

    return {
      transactionType: 'HYBRID',
      acquiringCompanyName: maEntities.acquiringCompanyName,
      targetCompanyName: maEntities.targetCompanyName,
      isAcquirerListed: maEntities.isAcquirerListed,
      issuingCompanyName: capitalEntities.issuingCompanyName,
      isIssuerListed: capitalEntities.isIssuerListed,
      primaryCompanyName: capitalEntities.issuingCompanyName || maEntities.acquiringCompanyName!,
      secondaryCompanyName: maEntities.targetCompanyName
    };
  }
};
