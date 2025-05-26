
/**
 * Smart caching service to reduce API calls and improve performance
 */
interface CacheEntry {
  data: any;
  timestamp: number;
  queryHash: string;
  category: string;
}

class SmartCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_EXPIRATION = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_CACHE_SIZE = 50;
  
  /**
   * Generate cache key from query and context
   */
  private generateCacheKey(query: string, category: string = 'general'): string {
    const normalizedQuery = query.toLowerCase().trim().substring(0, 100);
    return `${category}:${normalizedQuery}`;
  }
  
  /**
   * Get cached result if available and not expired
   */
  get(query: string, category: string = 'general', duration?: number): any | null {
    const key = this.generateCacheKey(query, category);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Use custom duration if provided, otherwise use default
    const expiration = duration || this.CACHE_EXPIRATION;
    
    // Check if expired
    if (Date.now() - entry.timestamp > expiration) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`Cache hit for query: ${query.substring(0, 50)}...`);
    return entry.data;
  }
  
  /**
   * Store result in cache with optional custom duration
   */
  set(query: string, data: any, category: string = 'general', duration?: number): void {
    const key = this.generateCacheKey(query, category);
    
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      queryHash: key,
      category
    });
  }
  
  /**
   * Get all cache keys for a specific category
   */
  getAllKeys(category?: string): string[] {
    const keys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (!category || entry.category === category) {
        // Extract the original query from the key (remove category prefix)
        const originalQuery = key.includes(':') ? key.split(':').slice(1).join(':') : key;
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
  }
  
  /**
   * Clear cache for testing or debugging
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; categories: string[] } {
    const categories = Array.from(new Set(Array.from(this.cache.values()).map(e => e.category)));
    return {
      size: this.cache.size,
      categories
    };
  }
}

export const smartCacheService = new SmartCacheService();
