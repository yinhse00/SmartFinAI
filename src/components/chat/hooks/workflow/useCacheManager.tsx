
import { smartCacheService } from '@/services/cache/smartCacheService';
import { useCacheDebugger } from './useCacheDebugger';

export const useCacheManager = () => {
  const { debugCheckCache, debugStoreCache, isCacheDisabled } = useCacheDebugger();

  // Enhanced query fingerprinting for more specific cache keys
  const generateQueryFingerprint = (query: string): string => {
    const normalized = query.toLowerCase().trim();
    
    // Extract intent indicators
    const intents = [];
    if (normalized.includes('what is') || normalized.includes('define') || normalized.includes('definition')) {
      intents.push('definition');
    }
    if (normalized.includes('how to') || normalized.includes('process') || normalized.includes('procedure')) {
      intents.push('process');
    }
    if (normalized.includes('why') || normalized.includes('reason')) {
      intents.push('explanation');
    }
    if (normalized.includes('when') || normalized.includes('timeline') || normalized.includes('timetable')) {
      intents.push('timing');
    }
    if (normalized.includes('requirement') || normalized.includes('must') || normalized.includes('shall')) {
      intents.push('requirements');
    }
    
    // Extract key entities and topics
    const entities = [];
    if (normalized.includes('connected transaction')) entities.push('connected-transaction');
    if (normalized.includes('rights issue')) entities.push('rights-issue');
    if (normalized.includes('general offer')) entities.push('general-offer');
    if (normalized.includes('mandatory offer')) entities.push('mandatory-offer');
    if (normalized.includes('rule 8.05')) entities.push('rule-8.05');
    if (normalized.includes('rule 26')) entities.push('rule-26');
    if (normalized.includes('chapter 14a')) entities.push('chapter-14a');
    if (normalized.includes('listing rules')) entities.push('listing-rules');
    if (normalized.includes('takeovers code')) entities.push('takeovers-code');
    
    // Extract action words
    const actions = [];
    if (normalized.includes('announce')) actions.push('announce');
    if (normalized.includes('disclose')) actions.push('disclose');
    if (normalized.includes('publish')) actions.push('publish');
    if (normalized.includes('submit')) actions.push('submit');
    if (normalized.includes('approve')) actions.push('approve');
    
    // Create a comprehensive fingerprint
    const fingerprint = [
      `intents:${intents.join(',')}`,
      `entities:${entities.join(',')}`,
      `actions:${actions.join(',')}`,
      `length:${normalized.length}`,
      `hash:${normalized.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)}`
    ].join('|');
    
    return fingerprint;
  };

  // Enhanced similarity check that considers query fingerprints
  const isSimilarQuery = (query1: string, query2: string): boolean => {
    // First check if queries are exactly the same
    if (query1.trim().toLowerCase() === query2.trim().toLowerCase()) {
      console.log('✅ EXACT MATCH detected');
      return true;
    }
    
    // Generate fingerprints for both queries
    const fingerprint1 = generateQueryFingerprint(query1);
    const fingerprint2 = generateQueryFingerprint(query2);
    
    console.log(`\n=== SIMILARITY CHECK ===`);
    console.log(`Query 1: "${query1.substring(0, 60)}..."`);
    console.log(`Query 2: "${query2.substring(0, 60)}..."`);
    console.log(`Fingerprint 1: ${fingerprint1}`);
    console.log(`Fingerprint 2: ${fingerprint2}`);
    
    // COMPLETELY DISABLE similarity-based caching
    // Only allow exact matches to use cache
    const threshold = 0.0;
    console.log(`Similarity threshold: ${threshold * 100}% (DISABLED)`);
    console.log(`Result: DIFFERENT (generating new response - similarity disabled)`);
    console.log(`=== SIMILARITY CHECK END ===\n`);
    
    return false; // Always return false to disable similarity caching
  };

  const checkCache = (query: string) => {
    // Check if caching is disabled for debugging
    if (isCacheDisabled()) {
      console.log(`🚫 CACHING COMPLETELY DISABLED FOR DEBUGGING`);
      return null;
    }

    // Log debug info
    debugCheckCache(query);

    console.log(`\n🔍 === CACHE CHECK START ===`);
    console.log(`Query: "${query}"`);
    console.log(`Query length: ${query.length} characters`);
    console.log(`Query fingerprint: ${generateQueryFingerprint(query)}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Check for exact match first - this is the ONLY type of caching we allow now
    let cachedResult = smartCacheService.get(query, 'regulatory');
    
    if (cachedResult) {
      console.log('✅ EXACT MATCH found in cache');
      console.log(`Cached response length: ${cachedResult.response?.length || 0} characters`);
      console.log(`Cache age: ${cachedResult.metadata?.timestamp ? Math.round((Date.now() - cachedResult.metadata.timestamp) / 1000 / 60) : 'unknown'} minutes`);
      console.log(`🔍 === CACHE CHECK END - USING CACHED RESULT ===\n`);
      return cachedResult;
    }
    
    console.log('❌ No exact match found');
    
    // Get all cache keys for debugging
    const cacheKeys = smartCacheService.getAllKeys('regulatory');
    console.log(`📊 Cache contains ${cacheKeys.length} entries`);
    
    // Log first few cache keys for debugging
    if (cacheKeys.length > 0) {
      console.log('📋 Current cache keys (first 3):');
      cacheKeys.slice(0, 3).forEach((key, index) => {
        console.log(`  ${index + 1}. "${key.substring(0, 80)}..."`);
      });
    }
    
    // NOTE: Similarity checking is completely disabled
    console.log('🔍 Similarity checking: DISABLED');
    console.log('📝 Only exact matches will use cache');
    
    console.log('❌ No cache match found - will generate new response');
    console.log(`🔍 === CACHE CHECK END - NO CACHE ===\n`);
    return null;
  };

  const storeInCache = (query: string, response: string, metadata: any) => {
    // Check if caching is disabled for debugging
    if (isCacheDisabled()) {
      console.log(`🚫 CACHING DISABLED - NOT STORING: "${query.substring(0, 50)}..."`);
      return;
    }

    // Log debug info
    debugStoreCache(query, response, metadata);

    console.log(`\n💾 === CACHE STORE START ===`);
    console.log(`Storing query: "${query.substring(0, 100)}..."`);
    console.log(`Response length: ${response.length} characters`);
    console.log(`Query fingerprint: ${generateQueryFingerprint(query)}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Reduce cache duration to 30 minutes for testing
    const cacheDuration = 30 * 60 * 1000; // 30 minutes instead of 2 hours
    
    smartCacheService.set(query, {
      response,
      metadata: { 
        ...metadata,
        timestamp: Date.now(),
        quality: 'high',
        queryLength: query.length,
        responseLength: response.length,
        queryFingerprint: generateQueryFingerprint(query),
        storedAt: new Date().toISOString()
      }
    }, 'regulatory', cacheDuration);
    
    console.log(`✅ Cache stored successfully (expires in 30 minutes)`);
    console.log(`💾 === CACHE STORE END ===\n`);
  };

  const clearCache = () => {
    console.log(`🗑️ Manually clearing all cache entries...`);
    smartCacheService.clear();
    console.log(`✅ Cache cleared successfully`);
  };

  const getCacheStats = () => {
    const stats = smartCacheService.getStats();
    console.log(`\n📊 === CACHE STATISTICS ===`);
    console.log(`Cache disabled: ${isCacheDisabled()}`);
    console.log(`Total entries: ${stats.size}`);
    console.log(`Categories: ${stats.categories.join(', ')}`);
    console.log(`Recent entries:`);
    stats.entries.slice(0, 5).forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.key} (${entry.age} min old, ${entry.responseLength || 0} chars)`);
    });
    console.log(`📊 === CACHE STATISTICS END ===\n`);
    return stats;
  };

  return {
    checkCache,
    storeInCache,
    clearCache,
    getCacheStats,
    generateQueryFingerprint,
    isCacheDisabled
  };
};
