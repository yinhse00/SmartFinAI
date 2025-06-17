
// Utility functions for validating and filtering shareholding data

// Patterns that indicate generic/placeholder shareholder names
const GENERIC_SHAREHOLDER_PATTERNS = [
  /^shareholder\s+[a-z]$/i,           // "Shareholder A", "Shareholder B", etc.
  /^public\s+shareholder$/i,          // Exact "Public Shareholder" (but not "Public Shareholders")
  /^existing\s+shareholder$/i,        // Exact "Existing Shareholder" (but not "Existing Shareholders")
  /^minority\s+shareholder$/i,        // "Minority Shareholder"
  /^other\s+shareholder$/i,           // "Other Shareholder"
  /^[a-z]\s+shareholder$/i,           // "A Shareholder", "B Shareholder"
  /^shareholder\s+group$/i,           // "Shareholder Group"
  /^unnamed\s+shareholder/i,          // "Unnamed Shareholder"
  /^placeholder/i,                    // Any variation of "Placeholder"
  /^sample/i,                         // Any variation of "Sample"
  /^example/i,                        // Any variation of "Example"
  /^test\s+shareholder/i,             // "Test Shareholder"
  /^dummy/i,                          // "Dummy" variations
];

/**
 * Checks if a shareholder name appears to be a generic placeholder
 * Now less aggressive - allows "Shareholder A", "Public Shareholders" etc.
 */
export const isGenericShareholderName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return true; // Empty or invalid names are considered generic
  }
  
  const trimmedName = name.trim();
  
  // Allow structured shareholder names like "Shareholder A", "Public Shareholders" 
  // These are often legitimate in financial structures
  if (/^shareholder\s+[a-z]$/i.test(trimmedName) || 
      /^public\s+shareholders$/i.test(trimmedName) ||
      /^existing\s+shareholders/i.test(trimmedName)) {
    return false; // These are considered valid structured names
  }
  
  // Check against remaining generic patterns
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
  companyName: string
): boolean => {
  // If no data, use fallback
  if (!shareholdingData || shareholdingData.length === 0) {
    return false;
  }
  
  // If all shareholders are generic, use fallback
  if (!isValidShareholdingData(shareholdingData)) {
    console.log(`🔍 Shareholding data contains only generic placeholders for ${companyName}, using fallback`);
    return false;
  }
  
  // Filter out generic shareholders and check if we have any valid ones left
  const validShareholders = filterValidShareholders(shareholdingData);
  if (validShareholders.length === 0) {
    console.log(`🔍 No valid shareholders found after filtering for ${companyName}, using fallback`);
    return false;
  }
  
  console.log(`✅ Found ${validShareholders.length} valid shareholders for ${companyName}`);
  return true;
};

/**
 * Gets validated shareholding data or returns empty array if data is not suitable
 */
export const getValidatedShareholdingData = (
  shareholdingData: Array<{ name: string; percentage: number }>,
  companyName: string
): Array<{ name: string; percentage: number }> => {
  if (!shouldUseShareholdingData(shareholdingData, companyName)) {
    return [];
  }
  
  return filterValidShareholders(shareholdingData);
};

/**
 * Determines which company the shareholding data likely belongs to based on context
 */
export const attributeShareholdingData = (
  shareholdingData: Array<{ name: string; percentage: number }>,
  entityNames: { acquiringCompanyName: string; targetCompanyName: string; isAcquirerListed: boolean }
): { acquirerShareholders: Array<{ name: string; percentage: number }>; targetShareholders: Array<{ name: string; percentage: number }> } => {
  
  if (!shareholdingData || shareholdingData.length === 0) {
    return { acquirerShareholders: [], targetShareholders: [] };
  }

  // For listed acquirers, typically the shareholding data represents the acquirer's shareholders
  // unless explicitly mentioned otherwise in shareholder names
  if (entityNames.isAcquirerListed) {
    const targetRelatedShareholders = shareholdingData.filter(holder => 
      holder.name.toLowerCase().includes(entityNames.targetCompanyName.toLowerCase()) ||
      holder.name.toLowerCase().includes('target') ||
      holder.name.toLowerCase().includes('existing shareholders of')
    );
    
    const acquirerShareholders = shareholdingData.filter(holder => 
      !targetRelatedShareholders.includes(holder)
    );
    
    return { 
      acquirerShareholders, 
      targetShareholders: targetRelatedShareholders 
    };
  }
  
  // For non-listed acquirers, shareholding data more likely belongs to target
  return { 
    acquirerShareholders: [], 
    targetShareholders: shareholdingData 
  };
};
