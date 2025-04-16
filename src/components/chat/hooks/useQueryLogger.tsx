
import { LogLevel, setTruncationLogLevel } from '@/utils/truncation';

/**
 * Hook for setting up and managing logging for the chat system
 */
export const useQueryLogger = () => {
  const setupLogging = () => {
    // Enable debug logging for truncation detection in development
    if (process.env.NODE_ENV === 'development') {
      setTruncationLogLevel(LogLevel.DEBUG);
    }
  };
  
  const logQueryStart = (queryText: string) => {
    console.group('Financial Query Processing');
    console.log('Processing query:', queryText);
  };
  
  const logContextInfo = (
    regulatoryContext: string | undefined, 
    reasoning: string | undefined,
    queryType: string,
    contextTime: number
  ) => {
    console.log('Financial Context Length:', regulatoryContext?.length);
    console.log('Financial Reasoning:', reasoning);
    console.log('Query Type:', queryType);
    console.log(`Context fetched in ${contextTime}ms`);
  };
  
  const logQueryParameters = (financialQueryType: string, temperature: number, maxTokens: number) => {
    console.log('Financial Query Type:', financialQueryType);
    console.log('Temperature:', temperature);
    console.log('Max Tokens:', maxTokens);
  };
  
  const finishLogging = () => {
    console.groupEnd();
  };
  
  return {
    setupLogging,
    logQueryStart,
    logContextInfo,
    logQueryParameters,
    finishLogging
  };
};
