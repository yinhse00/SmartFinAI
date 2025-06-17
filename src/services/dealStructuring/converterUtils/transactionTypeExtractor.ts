
/**
 * Utility functions for extracting and cleaning transaction types from AI responses
 */

export const extractBaseTransactionType = (transactionType: string): string => {
  if (!transactionType) return 'Transaction';
  
  // Convert to lowercase for pattern matching
  const lowerType = transactionType.toLowerCase();
  
  // Common transaction type patterns
  const typePatterns = [
    { pattern: /acquisition/i, type: 'Acquisition' },
    { pattern: /merger/i, type: 'Merger' },
    { pattern: /takeover/i, type: 'Takeover' },
    { pattern: /buyout/i, type: 'Buyout' },
    { pattern: /purchase/i, type: 'Purchase' },
    { pattern: /sale/i, type: 'Sale' },
    { pattern: /divestiture/i, type: 'Divestiture' },
    { pattern: /spin[- ]?off/i, type: 'Spin-off' },
    { pattern: /joint venture/i, type: 'Joint Venture' },
    { pattern: /restructuring/i, type: 'Restructuring' }
  ];
  
  // Find the first matching pattern
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(lowerType)) {
      return type;
    }
  }
  
  // If no pattern matches, try to extract the first word and capitalize it
  const firstWord = transactionType.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
  
  return 'Transaction';
};

export const buildCleanTypeDisplay = (
  baseType: string, 
  targetPercentage?: number
): string => {
  if (!targetPercentage || targetPercentage === 100) {
    return baseType;
  }
  
  return `${targetPercentage}% ${baseType}`;
};
