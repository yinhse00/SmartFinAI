
/**
 * Service for mapping regulatory references to their official URLs
 */

interface ReferenceUrlMapping {
  baseUrl: string;
  urlPattern: (identifier: string) => string;
}

const URL_MAPPINGS: Record<string, ReferenceUrlMapping> = {
  'listing_rule': {
    baseUrl: 'https://en-rules.hkex.com.hk/rulebook',
    urlPattern: (identifier: string) => `https://en-rules.hkex.com.hk/rulebook/${identifier.replace(/\./g, '').toLowerCase()}-0`
  },
  'chapter': {
    baseUrl: 'https://en-rules.hkex.com.hk/rulebook/listing-rules',
    urlPattern: (identifier: string) => `https://en-rules.hkex.com.hk/rulebook/listing-rules/chapter-${identifier}`
  },
  'takeovers_code': {
    baseUrl: 'https://www.sfc.hk/en/regulatory-functions/takeovers/takeovers-code',
    urlPattern: (identifier: string) => `https://www.sfc.hk/en/regulatory-functions/takeovers/takeovers-code#rule-${identifier.replace(/\./g, '-')}`
  },
  'faq': {
    baseUrl: 'https://en-rules.hkex.com.hk/faqs',
    urlPattern: (identifier: string) => `https://en-rules.hkex.com.hk/faqs/series-${identifier.split('.')[0]}`
  },
  'guidance_letter': {
    baseUrl: 'https://en-rules.hkex.com.hk/guidance-letters',
    urlPattern: (identifier: string) => `https://en-rules.hkex.com.hk/guidance-letters/${identifier.toLowerCase()}`
  },
  'listing_decision': {
    baseUrl: 'https://en-rules.hkex.com.hk/listing-decisions',
    urlPattern: (identifier: string) => `https://en-rules.hkex.com.hk/listing-decisions/${identifier.toLowerCase().replace(/\s+/g, '-')}`
  }
};

export interface ReferenceMapping {
  type: string;
  identifier: string;
  url: string;
  displayText: string;
}

/**
 * Get URL for a specific regulatory reference
 */
export const getReferenceUrl = (type: string, identifier: string): string | null => {
  const mapping = URL_MAPPINGS[type];
  if (!mapping) return null;
  
  try {
    return mapping.urlPattern(identifier);
  } catch (error) {
    console.warn(`Failed to generate URL for ${type} ${identifier}:`, error);
    return null;
  }
};

/**
 * Map a reference to its URL and display information
 */
export const mapReference = (type: string, identifier: string, originalText: string): ReferenceMapping | null => {
  const url = getReferenceUrl(type, identifier);
  if (!url) return null;
  
  return {
    type,
    identifier,
    url,
    displayText: originalText
  };
};

/**
 * Get all available reference types
 */
export const getSupportedReferenceTypes = (): string[] => {
  return Object.keys(URL_MAPPINGS);
};

export default {
  getReferenceUrl,
  mapReference,
  getSupportedReferenceTypes
};
