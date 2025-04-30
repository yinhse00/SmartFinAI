
/**
 * Tracks API key usage metrics for Grok API keys (tokens, truncation, success, recency).
 * Enhanced with aggressive load balancing metrics to prevent overloading.
 */

export interface ApiKeyUsage {
  key: string;
  tokensUsed: number;
  lastUsed: number;
  truncationCount: number;
  successCount: number;
  requestCount: number;
  lastHourRequests: number;
  consecutiveUses: number;
}

const keyUsageMap = new Map<string, ApiKeyUsage>();
let lastTruncatedKey = '';
const MAX_CONSECUTIVE_USES = 3; // Limit consecutive uses of the same key

// Track hourly request rates to prevent any single key from being overloaded
const HOUR_IN_MS = 60 * 60 * 1000;
setInterval(() => {
  // Reset hourly counters
  for (const usage of keyUsageMap.values()) {
    usage.lastHourRequests = 0;
  }
  console.log('Reset hourly API key usage counters');
}, HOUR_IN_MS);

// Reset consecutive use counters more frequently
setInterval(() => {
  for (const usage of keyUsageMap.values()) {
    usage.consecutiveUses = 0;
  }
  console.log('Reset consecutive use counters for API keys');
}, 5 * 60 * 1000); // Every 5 minutes

export function trackTokenUsage(key: string, tokens: number): void {
  if (!key || typeof tokens !== 'number') return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0,
    requestCount: 0,
    lastHourRequests: 0,
    consecutiveUses: 0
  };
  usage.tokensUsed += tokens;
  usage.lastUsed = Date.now();
  usage.requestCount++;
  usage.lastHourRequests++;
  usage.consecutiveUses++;
  keyUsageMap.set(key, usage);
  
  console.log(`Key ${key.substring(0, 8)}... used ${tokens} tokens, total: ${usage.tokensUsed}, consecutive uses: ${usage.consecutiveUses}`);
}

export function trackResponseQuality(key: string, wasTruncated: boolean): void {
  if (!key) return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0,
    requestCount: 0,
    lastHourRequests: 0,
    consecutiveUses: 0
  };

  if (wasTruncated) {
    usage.truncationCount++;
    lastTruncatedKey = key;
    console.log(`Key ${key.substring(0, 8)}... response was truncated, total truncations: ${usage.truncationCount}`);
  } else {
    usage.successCount++;
    console.log(`Key ${key.substring(0, 8)}... response was successful, total successes: ${usage.successCount}`);
  }

  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
}

/**
 * Returns the key with the lowest token usage to balance load
 */
export function getLeastUsedKey(keys: string[]): string | undefined {
  if (!keys.length) return undefined;
  
  // First, filter out keys that have been used too many consecutive times
  const availableKeys = keys.filter(key => {
    const usage = keyUsageMap.get(key);
    return !usage || usage.consecutiveUses < MAX_CONSECUTIVE_USES;
  });
  
  // If all keys have reached their consecutive use limit, reset and use all keys
  const keysToUse = availableKeys.length > 0 ? availableKeys : keys;
  
  // First prioritize keys with low hourly usage to prevent overloading
  const hourlyUsageOrder = [...keyUsageMap.values()]
    .filter(usage => keysToUse.includes(usage.key))
    .sort((a, b) => a.lastHourRequests - b.lastHourRequests);
  
  // If we have hourly usage data, prioritize keys with fewer recent requests
  if (hourlyUsageOrder.length > 0 && hourlyUsageOrder[0].lastHourRequests < 10) {
    return hourlyUsageOrder[0].key;
  }
  
  // Otherwise fall back to total token usage as the balancing metric
  let least: ApiKeyUsage | null = null;
  for (const key of keysToUse) {
    const usage = keyUsageMap.get(key);
    if (!usage) return key; // If no usage data, this key is fresh
    if (!least || usage.tokensUsed < least.tokensUsed) {
      least = usage;
    }
  }
  return least?.key || keysToUse[0];
}

/**
 * Returns the key with the best performance metrics (success rate, token efficiency)
 */
export function getBestPerformingKey(keys: string[]): string | undefined {
  if (!keys.length) return undefined;
  
  // Factor in both success rate and recent load for optimal selection
  let bestKey = null;
  let bestScore = -1;

  for (const key of keys) {
    const usage = keyUsageMap.get(key);
    if (!usage) return key; // If no usage data, this key is fresh
    
    // Skip keys that have been used too many consecutive times
    if (usage.consecutiveUses >= MAX_CONSECUTIVE_USES) {
      continue;
    }
    
    const totalResponses = usage.successCount + usage.truncationCount;
    if (totalResponses === 0) continue;
    
    // Calculate success rate
    const successRate = usage.successCount / totalResponses;
    
    // Calculate token efficiency (lower is better)
    const tokenFactor = usage.tokensUsed > 0 ? 1 - Math.min(1, Math.log10(usage.tokensUsed) / 6) : 1;
    
    // Factor in recent load (lower is better)
    const loadFactor = 1 - Math.min(1, usage.lastHourRequests / 20);
    
    // Factor in consecutive uses (lower is better)
    const consecutiveFactor = 1 - (usage.consecutiveUses / MAX_CONSECUTIVE_USES);
    
    // Combined score with weights
    const score = (successRate * 0.4) + (tokenFactor * 0.25) + (loadFactor * 0.2) + (consecutiveFactor * 0.15);

    if (bestScore < 0 || score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  
  // If no suitable key found (all reached consecutive use limit), use any key
  if (!bestKey && keys.length > 0) {
    return keys[Math.floor(Math.random() * keys.length)];
  }
  
  return bestKey || keys[0];
}

export function getLastTruncatedKey(): string {
  return lastTruncatedKey;
}

export function clearUsage(): void {
  keyUsageMap.clear();
  lastTruncatedKey = '';
}

// Add the missing resetUsageCounters function
export function resetUsageCounters(): void {
  // Reset usage counters while preserving the key structure
  for (const usage of keyUsageMap.values()) {
    usage.tokensUsed = 0;
    usage.truncationCount = 0;
    usage.successCount = 0;
    usage.requestCount = 0;
    usage.lastHourRequests = 0;
    usage.consecutiveUses = 0;
    usage.lastUsed = Date.now();
  }
  lastTruncatedKey = '';
  console.log('Reset all API key usage counters');
}
