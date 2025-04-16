
/**
 * Hook for building query parameters
 */
export const useQueryBuilder = () => {
  const buildResponseParams = (
    queryText: string, 
    temperature: number, 
    maxTokens: number, 
    regulatoryContext: string | undefined
  ) => {
    const responseParams: any = {
      prompt: queryText,
      temperature: temperature,
      maxTokens: maxTokens
    };
    
    if (regulatoryContext) {
      responseParams.regulatoryContext = regulatoryContext;
    }
    
    return responseParams;
  };
  
  return {
    buildResponseParams
  };
};
