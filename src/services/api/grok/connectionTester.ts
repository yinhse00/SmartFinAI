
import { forceResetAllCircuitBreakers } from './modules/endpointManager';

/**
 * Enhanced connection tester with cache control and improved retry logic
 */
export const connectionTester = {
  // Cache connection status to avoid unnecessary API calls
  connectionStatusCache: {
    isConnected: false,
    lastCheck: 0,
    models: [] as string[]
  },
  
  /**
   * Reset connection cache to force a fresh check
   */
  resetConnectionCache: () => {
    connectionTester.connectionStatusCache.isConnected = false;
    connectionTester.connectionStatusCache.lastCheck = 0;
    connectionTester.connectionStatusCache.models = [];
    console.log('Forcefully resetting connection cache and endpoint status');
  },
  
  /**
   * Test API connection by checking available models
   */
  testApiConnection: async (): Promise<{success: boolean, message: string, models?: string[], responseTime?: number}> => {
    try {
      // Check cache first - cache valid for only 30 seconds
      const cacheAge = Date.now() - connectionTester.connectionStatusCache.lastCheck;
      const CACHE_TTL = 30000; // 30 seconds
      
      if (connectionTester.connectionStatusCache.lastCheck > 0 && cacheAge < CACHE_TTL) {
        return {
          success: connectionTester.connectionStatusCache.isConnected,
          message: connectionTester.connectionStatusCache.isConnected 
            ? `Cached connection successful. Found ${connectionTester.connectionStatusCache.models.length} available models.`
            : 'Cached connection unsuccessful. Try again later.',
          models: connectionTester.connectionStatusCache.models,
          responseTime: 0 // Cached response
        };
      }
      
      // Try local proxy endpoint first (most likely to work)
      console.log('Testing connection to local proxy endpoint...');
      const startTime = Date.now();
      
      // Add cache busting to avoid stale responses
      const cacheBustParam = `?cacheBust=${Date.now()}`;
      const response = await fetch(`/api/grok/models${cacheBustParam}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Cache-Bust': Date.now().toString()
        },
        cache: 'no-store'
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        // Update cache with failure
        connectionTester.connectionStatusCache.isConnected = false;
        connectionTester.connectionStatusCache.lastCheck = Date.now();
        connectionTester.connectionStatusCache.models = [];
        
        // Force reset circuit breakers on connection failure
        await forceResetAllCircuitBreakers();
        
        return { 
          success: false, 
          message: `Connection failed with status: ${response.status}. ${await response.text()}`,
          responseTime
        };
      }
      
      const data = await response.json();
      const models = data?.data || [];
      
      // Update cache with success
      connectionTester.connectionStatusCache.isConnected = true;
      connectionTester.connectionStatusCache.lastCheck = Date.now();
      connectionTester.connectionStatusCache.models = models.map((m: any) => m.id);
      
      console.log('Local proxy connection successful, found', models.length, 'models');
      
      return {
        success: true,
        message: `Connection successful. Found ${models.length} available models.`,
        models: models.map((m: any) => m.id),
        responseTime
      };
    } catch (error) {
      // Update cache with failure
      connectionTester.connectionStatusCache.isConnected = false;
      connectionTester.connectionStatusCache.lastCheck = Date.now();
      connectionTester.connectionStatusCache.models = [];
      
      console.error('Connection test failed:', error);
      
      // Force reset circuit breakers on connection failure
      await forceResetAllCircuitBreakers();
      
      return { 
        success: false, 
        message: `Connection test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
  
  /**
   * Check if API is available with the provided API key
   */
  checkApiAvailability: async (apiKey: string | null): Promise<boolean> => {
    if (!apiKey) return false;
    
    try {
      // First try our cached result if recent
      const cacheAge = Date.now() - connectionTester.connectionStatusCache.lastCheck;
      if (connectionTester.connectionStatusCache.lastCheck > 0 && cacheAge < 15000) { // 15 seconds cache
        return connectionTester.connectionStatusCache.isConnected;
      }
      
      // Test connection with faster timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/grok/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache',
          'X-Cache-Bust': Date.now().toString()
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      const success = response.ok;
      
      // Update connection cache
      connectionTester.connectionStatusCache.isConnected = success;
      connectionTester.connectionStatusCache.lastCheck = Date.now();
      
      if (success) {
        const data = await response.json();
        connectionTester.connectionStatusCache.models = data?.data?.map((m: any) => m.id) || [];
        console.log('API key validation: Valid key found');
      } else {
        console.log('API key validation: Invalid key or connection issue');
      }
      
      return success;
    } catch (error) {
      console.error('Error checking API availability:', error);
      
      // Update connection cache with failure
      connectionTester.connectionStatusCache.isConnected = false;
      connectionTester.connectionStatusCache.lastCheck = Date.now();
      
      return false;
    }
  }
};
