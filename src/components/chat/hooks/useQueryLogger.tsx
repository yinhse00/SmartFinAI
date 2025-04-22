
import { useState, useEffect } from 'react';

/**
 * Hook for logging query processing details
 */
export const useQueryLogger = () => {
  const [isGroupOpen, setIsGroupOpen] = useState(false);

  // Close any open console groups on component unmount
  useEffect(() => {
    return () => {
      if (isGroupOpen) {
        console.groupEnd();
      }
    };
  }, [isGroupOpen]);

  const logQueryStart = (queryText: string) => {
    if (isGroupOpen) {
      console.groupEnd();
    }
    console.group('Processing Financial Regulatory Query');
    console.log('Query:', queryText);
    setIsGroupOpen(true);
  };

  const logContextInfo = (
    context: string, 
    reasoning: string, 
    financialQueryType: string,
    contextTime: number,
    searchStrategy?: string
  ) => {
    console.group('Context Retrieval');
    console.log('Query Type:', financialQueryType);
    console.log('Context Time:', `${contextTime}ms`);
    if (searchStrategy) {
      console.log('Search Strategy:', searchStrategy);
    }
    
    if (reasoning) {
      console.log('Reasoning:', reasoning);
    }
    
    if (context) {
      console.log('Context Length:', context.length);
      console.log('Context Sample:', context.substring(0, 100) + '...');
    } else {
      console.log('No context found');
    }
    console.groupEnd();
  };

  const logQueryParameters = (
    financialQueryType: string, 
    temperature: number,
    maxTokens: number
  ) => {
    console.group('Query Parameters');
    console.log('Financial Query Type:', financialQueryType);
    console.log('Temperature:', temperature);
    console.log('Max Tokens:', maxTokens);
    console.groupEnd();
  };
  
  const finishLogging = () => {
    if (isGroupOpen) {
      console.log('Query processing completed');
      console.groupEnd();
      setIsGroupOpen(false);
    }
  };

  return {
    logQueryStart,
    logContextInfo,
    logQueryParameters,
    finishLogging
  };
};

// Add the setupLogging function that's being imported in useQueryCore.tsx
export const setupLogging = () => {
  console.log('Setting up query logging...');
  return true;
};

// Export individual logging functions for direct import
export { 
  // Re-export the functions from the hook
  useQueryLogger as __useQueryLogger, // Avoid naming conflicts
};

