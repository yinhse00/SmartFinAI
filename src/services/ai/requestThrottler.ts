/**
 * Request Throttler to prevent hitting API rate limits
 * Implements exponential backoff and request queuing
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retryCount: number;
  provider: string;
}

export class RequestThrottler {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;
  private lastRequestTime: Record<string, number> = {};
  private minRequestInterval = 2000; // Minimum 2 seconds between requests
  private maxRetries = 3;
  private baseDelay = 1000;

  /**
   * Add a request to the throttled queue with exponential backoff retry
   */
  async throttledRequest<T>(
    execute: () => Promise<T>,
    provider: string = 'default',
    retryCount: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute,
        resolve,
        reject,
        retryCount,
        provider
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   */
  private async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const request = this.queue.shift()!;
    const { execute, resolve, reject, retryCount, provider } = request;

    try {
      // Check if we need to wait before making this request
      const now = Date.now();
      const lastRequest = this.lastRequestTime[provider] || 0;
      const timeSinceLastRequest = now - lastRequest;

      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        console.log(`⏳ Throttling ${provider} request - waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }

      // Execute the request
      this.lastRequestTime[provider] = Date.now();
      const result = await execute();
      resolve(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if this is a rate limit error that should be retried
      if (this.shouldRetry(errorMessage, retryCount)) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.warn(`⚠️ Rate limit hit for ${provider}, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await this.sleep(delay);
        
        // Re-queue with incremented retry count
        this.queue.unshift({
          execute,
          resolve,
          reject,
          retryCount: retryCount + 1,
          provider
        });
      } else {
        // Non-retryable error or max retries reached
        reject(error);
      }
    }

    // Process next request after a short delay
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(errorMessage: string, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Retry on rate limit errors
    return errorMessage.includes('429') || 
           errorMessage.includes('RATE_LIMIT') || 
           errorMessage.includes('Rate limit') ||
           errorMessage.includes('Resource exhausted');
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const delay = this.baseDelay * Math.pow(2, retryCount);
    // Add jitter (random 0-1000ms) to prevent thundering herd
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      lastRequestTimes: { ...this.lastRequestTime }
    };
  }

  /**
   * Clear the queue (emergency stop)
   */
  clearQueue() {
    this.queue.forEach(req => req.reject(new Error('Queue cleared')));
    this.queue = [];
    this.isProcessing = false;
  }
}

export const requestThrottler = new RequestThrottler();
