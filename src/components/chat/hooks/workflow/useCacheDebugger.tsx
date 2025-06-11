
import { smartCacheService } from '@/services/cache/smartCacheService';

export const useCacheDebugger = () => {
  // Debug mode flag - set to true to disable all caching
  const DISABLE_CACHE_FOR_DEBUGGING = false; // Set to true to completely disable caching
  
  const logCacheOperation = (operation: string, details: any) => {
    console.log(`\n🐛 === CACHE DEBUG: ${operation.toUpperCase()} ===`);
    console.log(details);
    console.log(`🐛 === END ${operation.toUpperCase()} ===\n`);
  };

  const debugCheckCache = (query: string) => {
    if (DISABLE_CACHE_FOR_DEBUGGING) {
      console.log(`🚫 CACHE DISABLED FOR DEBUGGING - Skipping cache check for: "${query.substring(0, 50)}..."`);
      return null;
    }
    
    logCacheOperation('check', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      queryLength: query.length,
      timestamp: new Date().toISOString()
    });
    
    return null; // Let the normal cache check proceed
  };

  const debugStoreCache = (query: string, response: string, metadata: any) => {
    if (DISABLE_CACHE_FOR_DEBUGGING) {
      console.log(`🚫 CACHE DISABLED FOR DEBUGGING - Skipping cache store for: "${query.substring(0, 50)}..."`);
      return;
    }
    
    logCacheOperation('store', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      responseLength: response.length,
      metadata: metadata,
      timestamp: new Date().toISOString()
    });
  };

  const debugClearCache = () => {
    console.log(`🧨 MANUALLY CLEARING CACHE FOR DEBUGGING`);
    smartCacheService.clear();
    console.log(`✅ Cache cleared manually`);
  };

  const debugCacheStats = () => {
    const stats = smartCacheService.getStats();
    console.log(`\n🔍 === DETAILED CACHE DEBUG INFO ===`);
    console.log(`Cache disabled: ${DISABLE_CACHE_FOR_DEBUGGING}`);
    console.log(`Total entries: ${stats.size}`);
    console.log(`Categories: ${stats.categories.join(', ')}`);
    console.log(`All entries:`);
    stats.entries.forEach((entry, index) => {
      console.log(`  ${index + 1}. Key: ${entry.key}`);
      console.log(`     Age: ${entry.age} minutes`);
      console.log(`     Query Length: ${entry.queryLength || 'unknown'}`);
      console.log(`     Response Length: ${entry.responseLength || 'unknown'}`);
      console.log(`     Category: ${entry.category}`);
    });
    console.log(`🔍 === END CACHE DEBUG INFO ===\n`);
    return stats;
  };

  const isCacheDisabled = () => DISABLE_CACHE_FOR_DEBUGGING;

  return {
    debugCheckCache,
    debugStoreCache,
    debugClearCache,
    debugCacheStats,
    isCacheDisabled,
    DISABLE_CACHE_FOR_DEBUGGING
  };
};
