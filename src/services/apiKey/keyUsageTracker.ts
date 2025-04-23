/**
 * Tracks usage metrics for Grok API keys (tokens, truncation, success, recency).
 * Enhanced with advanced load balancing metrics to prevent overloading.
 */

export interface ApiKeyUsage {
  key: string;
  tokensUsed: number;
  lastUsed: number;
  truncationCount: number;
  successCount: number;
  requestCount: number;
  lastHourRequests: number;
}

const keyUsageMap = new Map<string, ApiKeyUsage>();
let lastTruncatedKey = '';

// Track hourly request rates to prevent any single key from being overloaded
const HOUR_IN_MS = 60 * 60 * 1000;
setInterval(() => {
  // Reset hourly counters
  for (const usage of keyUsageMap.values()) {
    usage.lastHourRequests = 0;
  }
  console.log('Reset hourly API key usage counters');
}, HOUR_IN_MS);

export function trackTokenUsage(key: string, tokens: number): void {
  if (!key || typeof tokens !== 'number') return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0,
    requestCount: 0,
    lastHourRequests: 0
  };
  usage.tokensUsed += tokens;
  usage.lastUsed = Date.now();
  usage.requestCount++;
  usage.lastHourRequests++;
  keyUsageMap.set(key, usage);
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
    lastHourRequests: 0
  };

  if (wasTruncated) {
    usage.truncationCount++;
    lastTruncatedKey = key;
  } else {
    usage.successCount++;
  }

  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
}

/**
 * Returns the key with the lowest token usage to balance load
 */
export function getLeastUsedKey(keys: string[]): string | undefined {
  if (!keys.length) return undefined;
  
  // First prioritize keys with low hourly usage to prevent overloading
  const hourlyUsageOrder = [...keyUsageMap.values()]
    .filter(usage => keys.includes(usage.key))
    .sort((a, b) => a.lastHourRequests - b.lastHourRequests);
  
  // If we have hourly usage data, prioritize keys with fewer recent requests
  if (hourlyUsageOrder.length > 0 && hourlyUsageOrder[0].lastHourRequests < 10) {
    return hourlyUsageOrder[0].key;
  }
  
  // Otherwise fall back to total token usage as the balancing metric
  let least: ApiKeyUsage | null = null;
  for (const key of keys) {
    const usage = keyUsageMap.get(key);
    if (!usage) return key; // If no usage data, this key is fresh
    if (!least || usage.tokensUsed < least.tokensUsed) {
      least = usage;
    }
  }
  return least?.key || keys[0];
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
    
    const totalResponses = usage.successCount + usage.truncationCount;
    if (totalResponses === 0) continue;
    
    // Calculate success rate
    const successRate = usage.successCount / totalResponses;
    
    // Calculate token efficiency (lower is better)
    const tokenFactor = usage.tokensUsed > 0 ? 1 - Math.min(1, Math.log10(usage.tokensUsed) / 6) : 1;
    
    // Factor in recent load (lower is better)
    const loadFactor = 1 - Math.min(1, usage.lastHourRequests / 20);
    
    // Combined score with weights
    const score = (successRate * 0.5) + (tokenFactor * 0.3) + (loadFactor * 0.2);

    if (bestScore < 0 || score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestKey || keys[0];
}

export function getLastTruncatedKey(): string {
  return lastTruncatedKey;
}

export function clearUsage(): void {
  keyUsageMap.clear();
}
