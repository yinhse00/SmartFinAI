
import { tokenManagementService } from '@/services/response/modules/tokenManagementService';

export const useTokenManagement = () => {
  const enhanceTokenLimits = (
    queryText: string,
    responseParams: any,
    isSimpleQuery: boolean,
    isAggregationQuery: boolean
  ) => {
    const tokenLimit = tokenManagementService.getTokenLimit({
      queryType: responseParams.financialQueryType || 'general',
      prompt: queryText,
      isSimpleQuery
    });

    const temperature = tokenManagementService.getTemperature({
      queryType: responseParams.financialQueryType || 'general',
      prompt: queryText
    });

    return {
      ...responseParams,
      maxTokens: tokenLimit,
      temperature
    };
  };

  return {
    enhanceTokenLimits
  };
};
