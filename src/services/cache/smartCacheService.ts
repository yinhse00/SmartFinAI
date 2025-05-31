
/**
 * Smart caching service to reduce API calls and improve performance
 * Enhanced with better debugging and more specific cache key generation
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  queryHash: string;
  category: string;
  queryLength?: number;
  responseLength?: number;
  queryFingerprint?: string;
}

class SmartCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_EXPIRATION = 30 * 60 * 1000; // Reduced to 30 minutes for testing
  private readonly MAX_CACHE_SIZE = 50;
  
  /**
   * Generate more specific cache key from query and context
   */
  private generateCacheKey(query: string, category: string = 'general'): string {
    // Use the full query for cache key instead of truncating
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract key characteristics for better cache differentiation
    const queryType = this.detectQueryType(normalizedQuery);
    const topic = this.extractTopic(normalizedQuery);
    const intent = this.detectIntent(normalizedQuery);
    
    // Create more specific cache key that includes full query
    const keyComponents = [
      category,
      queryType,
      topic,
      intent,
      normalizedQuery // Use full query instead of substring
    ].filter(Boolean);
    
    const cacheKey = keyComponents.join('::'); // Use :: separator for clarity
    
    console.log(`🔑 Generated cache key components:`);
    console.log(`  - Category: ${category}`);
    console.log(`  - Query type: ${queryType}`);
    console.log(`  - Topic: ${topic}`);
    console.log(`  - Intent: ${intent}`);
    console.log(`  - Full cache key: ${cacheKey.substring(0, 120)}...`);
    
    return cacheKey;
  }
  
  /**
   * Detect the intent of the query for better cache differentiation
   */
  private detectIntent(query: string): string {
    if (query.includes('what is') || query.includes('define') || query.includes('definition')) {
      return 'definition';
    }
    if (query.includes('how to') || query.includes('process') || query.includes('procedure') || query.includes('steps')) {
      return 'process';
    }
    if (query.includes('why') || query.includes('reason') || query.includes('purpose')) {
      return 'explanation';
    }
    if (query.includes('when') || query.includes('timeline') || query.includes('timetable') || query.includes('deadline')) {
      return 'timing';
    }
    if (query.includes('requirement') || query.includes('must') || query.includes('shall') || query.includes('need to')) {
      return 'requirements';
    }
    if (query.includes('example') || query.includes('sample') || query.includes('instance')) {
      return 'example';
    }
    if (query.includes('difference') || query.includes('compare') || query.includes('versus') || query.includes('vs')) {
      return 'comparison';
    }
    return 'general';
  }
  
  /**
   * Detect the type of query for better cache differentiation
   */
  private detectQueryType(query: string): string {
    if (query.includes('timetable') || query.includes('timeline') || query.includes('schedule')) {
      return 'timetable';
    }
    if (query.includes('process') || query.includes('procedure') || query.includes('how to')) {
      return 'process';
    }
    if (query.includes('rule') || query.includes('requirement') || query.includes('regulation')) {
      return 'rule';
    }
    if (query.includes('takeover') || query.includes('offer')) {
      return 'takeover';
    }
    if (query.includes('rights issue') || query.includes('listing')) {
      return 'listing';
    }
    if (query.includes('what is') || query.includes('define') || query.includes('definition')) {
      return 'definition';
    }
    if (query.includes('connected transaction')) {
      return 'connected-transaction';
    }
    if (query.includes('announcement') || query.includes('disclosure')) {
      return 'announcement';
    }
    return 'general';
  }
  
  /**
   * Extract topic for better cache key specificity
   */
  private extractTopic(query: string): string {
    // Extract key regulatory topics with more granularity
    if (query.includes('connected transaction')) return 'connected-transaction';
    if (query.includes('rights issue')) return 'rights-issue';
    if (query.includes('general offer')) return 'general-offer';
    if (query.includes('mandatory offer')) return 'mandatory-offer';
    if (query.includes('chapter 14a')) return 'chapter-14a';
    if (query.includes('rule 26')) return 'rule-26';
    if (query.includes('rule 8.05')) return 'rule-8.05';
    if (query.includes('listing rules')) return 'listing-rules';
    if (query.includes('takeovers code')) return 'takeovers-code';
    if (query.includes('whitewash')) return 'whitewash';
    if (query.includes('placing')) return 'placing';
    if (query.includes('subscription')) return 'subscription';
    if (query.includes('open offer')) return 'open-offer';
    if (query.includes('spin-off')) return 'spin-off';
    
    return 'general';
  }
  
  /**
   * Get cached result if available and not expired
   */
  get(query: string, category: string = 'general', duration?: number): any | null {
    const key = this.generateCacheKey(query, category);
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache miss for key: ${key.substring(0, 80)}...`);
      return null;
    }
    
    // Use custom duration if provided, otherwise use default
    const expiration = duration || this.CACHE_EXPIRATION;
    
    // Check if expired
    if (Date.now() - entry.timestamp > expiration) {
      console.log(`⏰ Cache expired for key: ${key.substring(0, 80)}...`);
      this.cache.delete(key);
      return null;
    }
    
    const ageMinutes = Math.round((Date.now() - entry.timestamp) / 1000 / 60);
    console.log(`✅ Cache hit for query: ${query.substring(0, 60)}...`);
    console.log(`📅 Cache entry age: ${ageMinutes} minutes`);
    console.log(`📏 Response length: ${entry.data.response?.length || 0} characters`);
    
    return entry.data;
  }
  
  /**
   * Store result in cache with optional custom duration
   */
  set(query: string, data: any, category: string = 'general', duration?: number): void {
    const key = this.generateCacheKey(query, category);
    
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      console.log(`🧹 Cache size limit reached (${this.MAX_CACHE_SIZE}), cleaning old entries...`);
      this.cleanOldEntries();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      queryHash: key,
      category,
      queryLength: query.length,
      responseLength: data.response?.length || 0,
      queryFingerprint: data.metadata?.queryFingerprint
    });
    
    console.log(`💾 Cache entry stored with key: ${key.substring(0, 80)}...`);
    console.log(`📊 Total cache entries: ${this.cache.size}/${this.MAX_CACHE_SIZE}`);
  }
  
  /**
   * Get all cache keys for a specific category
   */
  getAllKeys(category?: string): string[] {
    const keys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (!category || entry.category === category) {
        // Extract the original query from the key (remove category, type, topic, intent prefixes)
        const parts = key.split('::');
        const originalQuery = parts.length > 4 ? parts.slice(4).join('::') : key;
        keys.push(originalQuery);
      }
    }
    console.log(`🔍 Found ${keys.length} cache keys for category: ${category || 'all'}`);
    return keys;
  }
  
  /**
   * Clean expired and old entries
   */
  private cleanOldEntries(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_EXPIRATION) {
        toDelete.push(key);
      }
    }
    
    // If not enough expired entries, remove oldest ones
    if (toDelete.length < 10) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 10).forEach(([key]) => toDelete.push(key));
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cleaned ${toDelete.length} old cache entries`);
  }
  
  /**
   * Clear cache for testing or debugging
   */
  clear(): void {
    const previousSize = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache cleared: removed ${previousSize} entries`);
  }
  
  /**
   * Get cache statistics with enhanced debugging info
   */
  getStats(): { size: number; categories: string[]; entries: Array<{key: string, age: number, category: string, queryLength?: number, responseLength?: number}> } {
    const categories = Array.from(new Set(Array.from(this.cache.values()).map(e => e.category)));
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 80) + '...',
      age: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
      category: entry.category,
      queryLength: entry.queryLength,
      responseLength: entry.responseLength
    }));
    
    console.log(`📊 Cache Statistics:`);
    console.log(`  - Size: ${this.cache.size}/${this.MAX_CACHE_SIZE}`);
    console.log(`  - Categories: ${categories.join(', ')}`);
    console.log(`  - Average age: ${entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.age, 0) / entries.length) : 0} minutes`);
    
    return {
      size: this.cache.size,
      categories,
      entries
    };
  }
}

export const smartCacheService = new SmartCacheService();
