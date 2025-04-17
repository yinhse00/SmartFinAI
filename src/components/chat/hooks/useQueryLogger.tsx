
import { LogLevel, setTruncationLogLevel } from '@/utils/truncation';

/**
 * Set up logging for the chat system
 */
export const setupLogging = () => {
  // Enable debug logging for truncation detection in development
  if (process.env.NODE_ENV === 'development') {
    setTruncationLogLevel(LogLevel.DEBUG);
  }
};

/**
 * Log the start of a query processing operation
 */
export const logQueryStart = (queryText: string) => {
  console.group('Financial Query Processing');
  console.log('Processing query:', queryText);
};

/**
 * Log information about retrieved context
 */
export const logContextInfo = (
  regulatoryContext: string,
  reasoning: string,
  queryType: string,
  contextTime: number
) => {
  console.log('Financial Context Length:', regulatoryContext.length);
  console.log('Financial Reasoning:', reasoning);
  console.log('Query Type:', queryType);
  console.log(`Context fetched in ${contextTime}ms`);
};

/**
 * Log query parameters used for processing
 */
export const logQueryParameters = (financialQueryType: string, temperature: number, maxTokens: number) => {
  console.log('Financial Query Type:', financialQueryType);
  console.log('Temperature:', temperature);
  console.log('Max Tokens:', maxTokens);
};

/**
 * Finish logging group
 */
export const finishLogging = () => {
  console.groupEnd();
};

/**
 * Hook for setting up and managing logging for the chat system (for backward compatibility)
 */
export const useQueryLogger = () => {
  return {
    setupLogging,
    logQueryStart,
    logContextInfo,
    logQueryParameters,
    finishLogging
  };
};
