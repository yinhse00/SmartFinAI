
/**
 * Tracks API response metrics
 */
import { trackTokenUsage, trackResponseQuality } from '../../../apiKeyService';

/**
 * Process API response and track usage metrics
 */
export const trackApiResponseMetrics = (
  apiKey: string, 
  responseData: any
): void => {
  // Track token usage if available
  if (responseData.usage?.total_tokens) {
    trackTokenUsage(apiKey, responseData.usage.total_tokens);
  }
  
  // Check for truncation in the response content
  const responseText = responseData.choices?.[0]?.message?.content || '';
  const isTruncated = responseText.endsWith('...') || 
                 responseText.includes("I'll continue") ||
                 responseText.includes('I will continue');
  
  // Track response quality for this key
  trackResponseQuality(apiKey, isTruncated);
};
