
// Utility functions for validating and filtering shareholding data

// Patterns that indicate generic/placeholder shareholder names
const GENERIC_SHAREHOLDER_PATTERNS = [
  /^shareholder\s+[a-z]$/i,           // "Shareholder A", "Shareholder B", etc.
  /^public\s+shareholder/i,           // "Public Shareholder"
  /^existing\s+shareholder/i,         // "Existing Shareholder"
  /^minority\s+shareholder/i,         // "Minority Shareholder"
  /^other\s+shareholder/i,            // "Other Shareholder"
  /^[a-z]\s+shareholder/i,            // "A Shareholder", "B Shareholder"
  /^shareholder\s+group/i,            // "Shareholder Group"
  /^unnamed\s+shareholder/i,          // "Unnamed Shareholder"
  /^placeholder/i,                    // Any variation of "Placeholder"
  /^sample/i,                         // Any variation of "Sample"
  /^example/i,                        // Any variation of "Example"
  /^test\s+shareholder/i,             // "Test Shareholder"
  /^dummy/i,                          // "Dummy" variations
];

/**
 * Checks if a shareholder name appears to be a generic placeholder
 */
export const isGenericShareholderName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return true; // Empty or invalid names are considered generic
  }
  
  const trimmedName = name.trim();
  
  // Check against known generic patterns
  return GENERIC_SHAREHOLDER_PATTERNS.some(pattern => pattern.test(trimmedName));
};

/**
 * Validates if shareholding data contains meaningful, specific shareholder information
 */
export const isValidShareholdingData = (shareholdingData: Array<{ name: string; percentage: number }>): boolean => {
  if (!shareholdingData || shareholdingData.length === 0) {
    return false;
  }
  
  // Check if all shareholders are generic - if so, data is not valid
  const allGeneric = shareholdingData.every(holder => isGenericShareholderName(holder.name));
  
  return !allGeneric;
};

/**
 * Filters out generic shareholders from shareholding data
 */
export const filterValidShareholders = (
  shareholdingData: Array<{ name: string; percentage: number }>
): Array<{ name: string; percentage: number }> => {
  if (!shareholdingData) {
    return [];
  }
  
  return shareholdingData.filter(holder => !isGenericShareholderName(holder.name));
};

/**
 * Determines if shareholding data should be used or if we should fall back to generic shareholders
 */
export const shouldUseShareholdingData = (
  shareholdingData: Array<{ name: string; percentage: number }>,
  targetCompanyName: string
): boolean => {
  // If no data, use fallback
  if (!shareholdingData || shareholdingData.length === 0) {
    return false;
  }
  
  // If all shareholders are generic, use fallback
  if (!isValidShareholdingData(shareholdingData)) {
    console.log(`🔍 Shareholding data contains only generic placeholders for ${targetCompanyName}, using fallback`);
    return false;
  }
  
  // Filter out generic shareholders and check if we have any valid ones left
  const validShareholders = filterValidShareholders(shareholdingData);
  if (validShareholders.length === 0) {
    console.log(`🔍 No valid shareholders found after filtering for ${targetCompanyName}, using fallback`);
    return false;
  }
  
  console.log(`✅ Found ${validShareholders.length} valid shareholders for ${targetCompanyName}`);
  return true;
};

/**
 * Gets validated shareholding data or returns empty array if data is not suitable
 */
export const getValidatedShareholdingData = (
  shareholdingData: Array<{ name: string; percentage: number }>,
  targetCompanyName: string
): Array<{ name: string; percentage: number }> => {
  if (!shouldUseShareholdingData(shareholdingData, targetCompanyName)) {
    return [];
  }
  
  return filterValidShareholders(shareholdingData);
};
