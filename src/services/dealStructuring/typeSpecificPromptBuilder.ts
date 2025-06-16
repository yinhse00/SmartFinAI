
import { TransactionType } from './transactionTypeClassifier';

/**
 * Build analysis prompts tailored to specific transaction types
 */
export const typeSpecificPromptBuilder = {
  /**
   * Build prompt for M&A transactions
   */
  buildMaPrompt: (description: string, documentContent: string): string => {
    return `
As a Hong Kong investment banking advisor, analyze this M&A TRANSACTION and provide professional-grade structuring advice focused on the acquisition/merger process.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS:\n${documentContent}\n` : ''}

This is an M&A transaction involving an acquirer and target company. Focus your analysis on:

1. **TRANSACTION STRUCTURE & TERMS**:
   - Acquisition method (share purchase, asset purchase, merger)
   - Target percentage being acquired (REQUIRED - specify exact percentage)
   - Consideration structure (cash/stock mix, payment terms)
   - Key conditions precedent for completion

2. **ENTITY IDENTIFICATION**:
   - Acquiring company name and status (listed/private)
   - Target company name and current ownership
   - Any intermediate holding structures

3. **SHAREHOLDING IMPACT**:
   - Target company: before acquisition ownership structure
   - Target company: after acquisition ownership changes
   - Acquirer: impact on existing shareholders (if listed)

4. **TRANSACTION STEPS**:
   - Due diligence and negotiation phase
   - Agreement execution and regulatory submissions
   - Shareholder/regulatory approvals
   - Completion and settlement

FORMAT: Return structured JSON focusing on M&A-specific elements with clear acquirer-target relationships.

{
  "transactionType": "M&A Transaction",
  "structure": {
    "recommended": "acquisition method with commercial rationale",
    "majorTerms": {
      "targetPercentage": number (REQUIRED),
      "considerationAmount": number,
      "paymentStructure": {"cashPercentage": number, "stockPercentage": number}
    }
  },
  "corporateStructure": {
    "entities": [
      {"name": "AcquiringCompany", "type": "issuer|parent", "ownership": number},
      {"name": "TargetCompany", "type": "target", "ownership": number}
    ],
    "mainIssuer": "AcquiringCompany"
  },
  "shareholding": {
    "before": [{"name": "Current Target Shareholders", "percentage": 100}],
    "after": [{"name": "AcquiringCompany", "percentage": targetPercentage}]
  },
  "transactionFlow": {
    "majorTransactionSteps": [
      {"id": "step1", "title": "Due Diligence", "description": "...", "entities": ["acquirer", "target"]},
      {"id": "step2", "title": "Agreement", "description": "...", "entities": ["acquirer", "target"]},
      {"id": "step3", "title": "Completion", "description": "...", "entities": ["acquirer", "target"]}
    ]
  }
}`;
  },

  /**
   * Build prompt for capital raising transactions
   */
  buildCapitalRaisingPrompt: (description: string, documentContent: string): string => {
    return `
As a Hong Kong capital markets advisor, analyze this CAPITAL RAISING TRANSACTION and provide professional-grade advice focused on the equity fundraising process.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS:\n${documentContent}\n` : ''}

This is a capital raising transaction by a single company. Focus your analysis on:

1. **CAPITAL RAISING STRUCTURE**:
   - Type of offering (rights issue, open offer, placement)
   - Amount being raised and use of proceeds
   - Issue price and discount to market price
   - Rights ratio or subscription terms

2. **ISSUING COMPANY**:
   - Company name and listing status
   - Current share capital and market capitalization
   - Existing major shareholders

3. **SHAREHOLDING DILUTION IMPACT**:
   - Current shareholding structure (before)
   - Post-capital raising shareholding (after dilution)
   - Rights entitlements and take-up assumptions
   - Impact on existing shareholders

4. **CAPITAL RAISING PROCESS**:
   - Announcement and record date setting
   - Rights trading period (if applicable)
   - Application and payment procedures
   - Allotment and listing of new shares

FORMAT: Return structured JSON focusing on single-company capital raising with dilution analysis.

{
  "transactionType": "Capital Raising",
  "structure": {
    "recommended": "capital raising method with rationale",
    "majorTerms": {
      "proceedsAmount": number (REQUIRED),
      "issuePrice": number,
      "rightsRatio": "X rights for Y existing shares",
      "useOfProceeds": "description"
    }
  },
  "corporateStructure": {
    "entities": [
      {"name": "IssuingCompany", "type": "issuer", "isCapitalRaising": true}
    ],
    "mainIssuer": "IssuingCompany"
  },
  "shareholding": {
    "before": [{"name": "Existing Shareholders", "percentage": 100}],
    "after": [
      {"name": "Existing Shareholders (diluted)", "percentage": number},
      {"name": "New Shareholders", "percentage": number}
    ]
  },
  "transactionFlow": {
    "majorTransactionSteps": [
      {"id": "step1", "title": "Announcement", "description": "...", "entities": ["issuer"]},
      {"id": "step2", "title": "Record Date", "description": "...", "entities": ["issuer", "shareholders"]},
      {"id": "step3", "title": "Settlement", "description": "...", "entities": ["issuer", "new_shareholders"]}
    ]
  },
  "dealEconomics": {
    "proceedsAmount": number,
    "currency": "HKD",
    "dilutionPercentage": number
  }
}`;
  },

  /**
   * Build prompt for hybrid transactions
   */
  buildHybridPrompt: (description: string, documentContent: string): string => {
    return `
As a Hong Kong investment banking advisor, analyze this HYBRID TRANSACTION combining both M&A and capital raising elements.

TRANSACTION DESCRIPTION:
${description}

${documentContent ? `UPLOADED DOCUMENTS:\n${documentContent}\n` : ''}

This is a complex transaction with both acquisition and capital raising components. Analyze:

1. **HYBRID STRUCTURE**:
   - Acquisition component (target, percentage, consideration)
   - Capital raising component (amount, method, timing)
   - Relationship between the two elements

2. **MULTI-PARTY ANALYSIS**:
   - Acquiring company and its funding needs
   - Target company being acquired
   - Existing shareholders of both entities

3. **COMPLEX SHAREHOLDING IMPACT**:
   - Pre-transaction structure of all parties
   - Impact of capital raising on acquirer
   - Impact of acquisition on target
   - Final combined ownership structure

4. **INTEGRATED PROCESS**:
   - Sequencing of capital raising and acquisition
   - Conditional relationships between components
   - Regulatory coordination requirements

FORMAT: Return structured JSON addressing both M&A and capital raising elements.

{
  "transactionType": "Hybrid Transaction",
  "structure": {
    "recommended": "integrated transaction structure",
    "majorTerms": {
      "acquisitionComponent": {"targetPercentage": number, "considerationAmount": number},
      "capitalRaisingComponent": {"proceedsAmount": number, "method": "string"}
    }
  },
  "corporateStructure": {
    "entities": [
      {"name": "AcquiringCompany", "type": "issuer"},
      {"name": "TargetCompany", "type": "target"}
    ]
  },
  "transactionFlow": {
    "majorTransactionSteps": [
      {"id": "step1", "title": "Capital Raising", "description": "...", "entities": ["acquirer"]},
      {"id": "step2", "title": "Acquisition", "description": "...", "entities": ["acquirer", "target"]},
      {"id": "step3", "title": "Integration", "description": "...", "entities": ["combined_entity"]}
    ]
  }
}`;
  },

  /**
   * Select appropriate prompt based on transaction type
   */
  buildPromptForType: (
    transactionType: TransactionType,
    description: string,
    documentContent: string
  ): string => {
    switch (transactionType) {
      case 'M&A':
        return typeSpecificPromptBuilder.buildMaPrompt(description, documentContent);
      case 'CAPITAL_RAISING':
        return typeSpecificPromptBuilder.buildCapitalRaisingPrompt(description, documentContent);
      case 'HYBRID':
        return typeSpecificPromptBuilder.buildHybridPrompt(description, documentContent);
      default:
        return typeSpecificPromptBuilder.buildMaPrompt(description, documentContent);
    }
  }
};
