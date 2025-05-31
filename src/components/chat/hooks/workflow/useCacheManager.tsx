
import { smartCacheService } from '@/services/cache/smartCacheService';

export const useCacheManager = () => {
  // Helper method to check query similarity with enhanced debugging
  const isSimilarQuery = (query1: string, query2: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const words1 = normalize(query1).split(/\s+/);
    const words2 = normalize(query2).split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    // Set threshold to 0% to disable similarity-based caching
    const threshold = 0.0;
    
    console.log(`Cache similarity check: "${query1.substring(0, 50)}..." vs "${query2.substring(0, 50)}..."`);
    console.log(`Similarity score: ${(similarity * 100).toFixed(1)}%, threshold: ${(threshold * 100)}%`);
    console.log(`Common words: [${commonWords.join(', ')}]`);
    
    const isSimilar = similarity > threshold;
    console.log(`Result: ${isSimilar ? 'SIMILAR (using cache)' : 'DIFFERENT (generating new response)'}`);
    
    return isSimilar;
  };

  const checkCache = (query: string) => {
    console.log(`\n=== CACHE CHECK START ===`);
    console.log(`Query: "${query}"`);
    
    // Check for exact match first
    let cachedResult = smartCacheService.get(query, 'regulatory');
    
    if (cachedResult) {
      console.log('✅ EXACT MATCH found in cache');
      console.log(`=== CACHE CHECK END ===\n`);
      return cachedResult;
    }
    
    console.log('❌ No exact match found');
    
    // Check for similar queries (now with 0% threshold, this should rarely match)
    const cacheKeys = smartCacheService.getAllKeys('regulatory');
    console.log(`Checking ${cacheKeys.length} cached queries for similarity...`);
    
    for (const key of cacheKeys) {
      if (key && isSimilarQuery(query, key)) {
        cachedResult = smartCacheService.get(key, 'regulatory');
        console.log(`✅ SIMILAR MATCH found: "${key}"`);
        console.log(`=== CACHE CHECK END ===\n`);
        return cachedResult;
      }
    }
    
    console.log('❌ No similar queries found');
    console.log(`=== CACHE CHECK END ===\n`);
    return null;
  };

  const storeInCache = (query: string, response: string, metadata: any) => {
    console.log(`\n=== CACHE STORE ===`);
    console.log(`Storing query: "${query.substring(0, 100)}..."`);
    console.log(`Response length: ${response.length} characters`);
    
    smartCacheService.set(query, {
      response,
      metadata: { 
        ...metadata,
        timestamp: Date.now(),
        quality: 'high',
        queryLength: query.length,
        responseLength: response.length
      }
    }, 'regulatory', 2 * 60 * 60 * 1000); // 2 hours cache duration
    
    console.log(`Cache stored successfully`);
    console.log(`=== CACHE STORE END ===\n`);
  };

  return {
    checkCache,
    storeInCache
  };
};
