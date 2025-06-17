
/**
 * Utility to clean transaction types from AI responses
 * Removes embedded percentages, amounts, and currency codes
 */

export const cleanTransactionType = (rawType: string): string => {
  if (!rawType || typeof rawType !== 'string') {
    return 'Transaction';
  }

  console.log('Cleaning transaction type:', rawType);

  // Remove common currency codes and amounts
  let cleaned = rawType
    // Remove currency amounts (e.g., "HKD75000M", "USD100M", "HKD 75M")
    .replace(/[A-Z]{3}\s*\d+[KMB]?/gi, '')
    // Remove standalone amounts (e.g., "75M", "100K")
    .replace(/\d+[KMB]/gi, '')
    // Remove percentages (e.g., "100%", "51%")
    .replace(/\d+%/g, '')
    // Remove extra whitespace and special characters
    .replace(/[^\w\s]/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Extract the base transaction type
  const lowerCleaned = cleaned.toLowerCase();
  
  if (lowerCleaned.includes('acquisition') || lowerCleaned.includes('acquire')) {
    return 'Acquisition';
  } else if (lowerCleaned.includes('merger') || lowerCleaned.includes('merge')) {
    return 'Merger';
  } else if (lowerCleaned.includes('investment') || lowerCleaned.includes('invest')) {
    return 'Investment';
  } else if (lowerCleaned.includes('buyout')) {
    return 'Buyout';
  } else if (lowerCleaned.includes('restructuring') || lowerCleaned.includes('restructure')) {
    return 'Restructuring';
  } else if (lowerCleaned.includes('divestiture') || lowerCleaned.includes('divest')) {
    return 'Divestiture';
  } else if (lowerCleaned.includes('spinoff') || lowerCleaned.includes('spin')) {
    return 'Spinoff';
  } else if (lowerCleaned.includes('joint venture') || lowerCleaned.includes('jv')) {
    return 'Joint Venture';
  } else if (lowerCleaned.includes('ipo') || lowerCleaned.includes('listing')) {
    return 'IPO';
  } else if (cleaned.trim()) {
    // If we have some cleaned text but no recognized pattern, capitalize first word
    const words = cleaned.trim().split(' ');
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }

  console.log('Cleaned transaction type result:', cleaned || 'Transaction');
  return cleaned || 'Transaction';
};

export const extractTransactionPercentage = (rawType: string): number | undefined => {
  if (!rawType || typeof rawType !== 'string') {
    return undefined;
  }

  const percentageMatch = rawType.match(/(\d+)%/);
  return percentageMatch ? parseInt(percentageMatch[1]) : undefined;
};
