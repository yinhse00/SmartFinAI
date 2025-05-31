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
}

class SmartCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_EXPIRATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 50;
  
  /**
   * Generate more specific cache key from query and context
   */
  private generateCacheKey(query: string, category: string = 'general'): string {
    // Enhanced key generation to be more specific
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract key characteristics for better cache differentiation
    const queryType = this.detectQueryType(normalizedQuery);
    const topic = this.extractTopic(normalizedQuery);
    
    // Create more specific cache key
    const keyComponents = [
      category,
      queryType,
      topic,
      normalizedQuery.substring(0, 100)
    ].filter(Boolean);
    
    const cacheKey = keyComponents.join(':');
    
    console.log(`Generated cache key: ${cacheKey.substring(0, 80)}...`);
    return cacheKey;
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
    return 'general';
  }
  
  /**
   * Extract topic for better cache key specificity
   */
  private extractTopic(query: string): string {
    // Extract key regulatory topics
    if (query.includes('connected transaction')) return 'connected-transaction';
    if (query.includes('rights issue')) return 'rights-issue';
    if (query.includes('general offer')) return 'general-offer';
    if (query.includes('mandatory offer')) return 'mandatory-offer';
    if (query.includes('chapter 14a')) return 'chapter-14a';
    if (query.includes('rule 26')) return 'rule-26';
    if (query.includes('rule 8.05')) return 'rule-8.05';
    if (query.includes('listing rules')) return 'listing-rules';
    if (query.includes('takeovers code')) return 'takeovers-code';
    
    return 'general';
  }
  
  /**
   * Get cached result if available and not expired
   */
  get(query: string, category: string = 'general', duration?: number): any | null {
    const key = this.generateCacheKey(query, category);
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`Cache miss for key: ${key.substring(0, 50)}...`);
      return null;
    }
    
    // Use custom duration if provided, otherwise use default
    const expiration = duration || this.CACHE_EXPIRATION;
    
    // Check if expired
    if (Date.now() - entry.timestamp > expiration) {
      console.log(`Cache expired for key: ${key.substring(0, 50)}...`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ Cache hit for query: ${query.substring(0, 50)}...`);
    console.log(`Cache entry age: ${Math.round((Date.now() - entry.timestamp) / 1000 / 60)} minutes`);
    return entry.data;
  }
  
  /**
   * Store result in cache with optional custom duration
   */
  set(query: string, data: any, category: string = 'general', duration?: number): void {
    const key = this.generateCacheKey(query, category);
    
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      console.log(`Cache size limit reached (${this.MAX_CACHE_SIZE}), cleaning old entries...`);
      this.cleanOldEntries();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      queryHash: key,
      category,
      queryLength: query.length,
      responseLength: data.response?.length || 0
    });
    
    console.log(`Cache entry stored with key: ${key.substring(0, 50)}...`);
    console.log(`Total cache entries: ${this.cache.size}`);
  }
  
  /**
   * Get all cache keys for a specific category
   */
  getAllKeys(category?: string): string[] {
    const keys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (!category || entry.category === category) {
        // Extract the original query from the key (remove category and type prefixes)
        const parts = key.split(':');
        const originalQuery = parts.length > 3 ? parts.slice(3).join(':') : key;
        keys.push(originalQuery);
      }
    }
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
    console.log(`Cleaned ${toDelete.length} old cache entries`);
  }
  
  /**
   * Clear cache for testing or debugging
   */
  clear(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; categories: string[]; entries: Array<{key: string, age: number, category: string}> } {
    const categories = Array.from(new Set(Array.from(this.cache.values()).map(e => e.category)));
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 50) + '...',
      age: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
      category: entry.category
    }));
    
    return {
      size: this.cache.size,
      categories,
      entries
    };
  }
}

export const smartCacheService = new SmartCacheService();
