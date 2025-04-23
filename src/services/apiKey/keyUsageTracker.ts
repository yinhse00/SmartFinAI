
/**
 * Tracks usage metrics for Grok API keys (tokens, truncation, success, recency).
 */

export interface ApiKeyUsage {
  key: string;
  tokensUsed: number;
  lastUsed: number;
  truncationCount: number;
  successCount: number;
}

const keyUsageMap = new Map<string, ApiKeyUsage>();
let lastTruncatedKey = '';

export function trackTokenUsage(key: string, tokens: number): void {
  if (!key || typeof tokens !== 'number') return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0
  };
  usage.tokensUsed += tokens;
  usage.lastUsed = Date.now();
  keyUsageMap.set(key, usage);
}

export function trackResponseQuality(key: string, wasTruncated: boolean): void {
  if (!key) return;
  const usage = keyUsageMap.get(key) || {
    key,
    tokensUsed: 0,
    lastUsed: Date.now(),
    truncationCount: 0,
    successCount: 0
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

export function getLeastUsedKey(keys: string[]): string | undefined {
  if (!keyUsageMap.size) return keys[0];
  let least: ApiKeyUsage | null = null;
  for (const usage of keyUsageMap.values()) {
    if (!least || usage.tokensUsed < least.tokensUsed) {
      least = usage;
    }
  }
  return least?.key || keys[0];
}

export function getBestPerformingKey(keys: string[]): string | undefined {
  if (!keyUsageMap.size) return keys[0];
  let bestKey = null;
  let bestScore = -1;

  for (const usage of keyUsageMap.values()) {
    const totalResponses = usage.successCount + usage.truncationCount;
    if (totalResponses === 0) continue;
    const successRate = usage.successCount / totalResponses;
    const tokenFactor = usage.tokensUsed > 0 ? 1 - Math.min(1, Math.log10(usage.tokensUsed) / 6) : 1;
    const score = (successRate * 0.7) + (tokenFactor * 0.3);

    if (bestScore < 0 || score > bestScore) {
      bestScore = score;
      bestKey = usage.key;
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

