
import { smartCacheService } from '@/services/cache/smartCacheService';

export const useCacheManager = () => {
  // Helper method to check query similarity
  const isSimilarQuery = (query1: string, query2: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const words1 = normalize(query1).split(/\s+/);
    const words2 = normalize(query2).split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    return similarity > 0.6; // 60% similarity threshold
  };

  const checkCache = (query: string) => {
    // Check for exact match first
    let cachedResult = smartCacheService.get(query, 'regulatory');
    
    // If no exact match, check for similar queries
    if (!cachedResult) {
      const cacheKeys = smartCacheService.getAllKeys('regulatory');
      for (const key of cacheKeys) {
        if (key && isSimilarQuery(query, key)) {
          cachedResult = smartCacheService.get(key, 'regulatory');
          console.log('Found similar cached query:', key);
          break;
        }
      }
    }
    
    return cachedResult;
  };

  const storeInCache = (query: string, response: string, metadata: any) => {
    smartCacheService.set(query, {
      response,
      metadata: { 
        ...metadata,
        timestamp: Date.now(),
        quality: 'high'
      }
    }, 'regulatory', 2 * 60 * 60 * 1000); // 2 hours cache duration
  };

  return {
    checkCache,
    storeInCache
  };
};
