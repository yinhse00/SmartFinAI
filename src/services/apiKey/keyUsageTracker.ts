
// Track API key usage to avoid rate limits

let requestCount = 0;
let tokenCount = 0;
let lastResetTime = Date.now();

// Reset counters when rotating keys
export const resetUsageCounters = () => {
  requestCount = 0;
  tokenCount = 0;
  lastResetTime = Date.now();
  console.log('API key usage counters reset');
};

// Track a new request
export const trackRequest = (tokens = 0) => {
  requestCount++;
  tokenCount += tokens;
  
  // Auto-reset counters after an hour
  if (Date.now() - lastResetTime > 3600000) {
    resetUsageCounters();
  }
  
  return { requestCount, tokenCount };
};

// Check if we're approaching rate limits
export const shouldRotateKey = () => {
  // Rotate if we've made more than 50 requests or used more than 100k tokens in the last hour
  return requestCount > 50 || tokenCount > 100000;
};
