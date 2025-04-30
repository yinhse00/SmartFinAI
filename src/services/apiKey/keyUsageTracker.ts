
/**
 * Tracks API key usage statistics and performance
 */

type KeyUsageData = {
  [key: string]: {
    useCount: number;       // Number of times the key was used
    tokenCount: number;     // Total tokens used
    successCount: number;   // Number of successful responses
    failureCount: number;   // Number of failures or truncations
    qualityScore: number;   // Average quality score (1-10)
    lastUsed: number;       // Timestamp of last use
    truncationCount: number; // Number of truncated responses
  };
};

// In-memory store for key usage metrics
let keyUsageData: KeyUsageData = {};
let lastTruncatedKey: string | null = null;

// Track token usage for an API key
export function trackTokenUsage(apiKey: string, tokens: number, wasSuccessful: boolean = true, wasTruncated: boolean = false): void {
  if (!apiKey || !apiKey.startsWith('xai-')) return; // Don't track invalid keys
  
  // Initialize data for this key if not exists
  if (!keyUsageData[apiKey]) {
    keyUsageData[apiKey] = {
      useCount: 0,
      tokenCount: 0,
      successCount: 0,
      failureCount: 0,
      qualityScore: 5, // Default middle score
      lastUsed: Date.now(),
      truncationCount: 0
    };
  }
  
  // Update metrics
  keyUsageData[apiKey].useCount++;
  keyUsageData[apiKey].tokenCount += tokens;
  keyUsageData[apiKey].lastUsed = Date.now();
  
  if (wasSuccessful) {
    keyUsageData[apiKey].successCount++;
  } else {
    keyUsageData[apiKey].failureCount++;
  }
  
  if (wasTruncated) {
    keyUsageData[apiKey].truncationCount++;
    lastTruncatedKey = apiKey; // Remember this key had truncation
  }
}

// Track response quality (1-10 scale)
export function trackResponseQuality(apiKey: string, qualityScore: number): void {
  if (!apiKey || !apiKey.startsWith('xai-') || qualityScore < 1 || qualityScore > 10) return;
  
  // Initialize if needed
  if (!keyUsageData[apiKey]) {
    keyUsageData[apiKey] = {
      useCount: 0,
      tokenCount: 0,
      successCount: 0,
      failureCount: 0,
      qualityScore: qualityScore,
      lastUsed: Date.now(),
      truncationCount: 0
    };
    return;
  }
  
  // Weighted average (30% new score, 70% existing)
  const currentScore = keyUsageData[apiKey].qualityScore;
  keyUsageData[apiKey].qualityScore = (currentScore * 0.7) + (qualityScore * 0.3);
}

// Get least used key (considering recent usage and load)
export function getLeastUsedKey(keys: string[]): string | null {
  if (!keys || keys.length === 0) return null;
  if (keys.length === 1) return keys[0];
  
  // Simple algorithm: find key with lowest useCount
  return keys.reduce((leastUsedKey, currentKey) => {
    // If we have no data for this key, it's probably unused
    if (!keyUsageData[currentKey]) return currentKey;
    
    // If we have no data for least used key, current key becomes least used
    if (!keyUsageData[leastUsedKey]) return leastUsedKey;
    
    // Compare use counts
    return keyUsageData[currentKey].useCount < keyUsageData[leastUsedKey].useCount
      ? currentKey
      : leastUsedKey;
  }, keys[0]);
}

// Get highest performing key based on quality
export function getBestPerformingKey(keys: string[]): string | null {
  if (!keys || keys.length === 0) return null;
  if (keys.length === 1) return keys[0];
  
  // Find highest quality score
  return keys.reduce((bestKey, currentKey) => {
    // If we have no data, assume average quality (5)
    const currentQuality = keyUsageData[currentKey]?.qualityScore || 5;
    const bestQuality = keyUsageData[bestKey]?.qualityScore || 5;
    
    // Prefer key with higher quality score
    return currentQuality > bestQuality ? currentKey : bestKey;
  }, keys[0]);
}

// Get the key that had truncation most recently
export function getLastTruncatedKey(): string | null {
  return lastTruncatedKey;
}

// Clear usage data
export function clearUsage(): void {
  keyUsageData = {};
  lastTruncatedKey = null;
}

// Reset usage counters
export const resetUsageCounters = () => {
  requestCount = 0;
  tokenCount = 0;
  lastResetTime = Date.now();
  console.log('API key usage counters reset');
};

// Track a new request
export const trackRequest = (tokens = 0) => {
  requestCount++;
  tokenCount += tokens;
  
  // Auto-reset counters after an hour
  if (Date.now() - lastResetTime > 3600000) {
    resetUsageCounters();
  }
  
  return { requestCount, tokenCount };
};

// Check if we're approaching rate limits
export const shouldRotateKey = () => {
  // Rotate if we've made more than 50 requests or used more than 100k tokens in the last hour
  return requestCount > 50 || tokenCount > 100000;
};

// Track API key usage to avoid rate limits
let requestCount = 0;
let tokenCount = 0;
let lastResetTime = Date.now();
