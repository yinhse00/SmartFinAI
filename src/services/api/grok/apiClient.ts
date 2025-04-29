
import { handleChatCompletions } from './modules/apiRequestHandler';
import { MessageContent } from './types';

export const apiClient = {
  callChatCompletions: async (requestBody: any, providedApiKey?: string): Promise<any> => {
    return await handleChatCompletions(requestBody, providedApiKey);
  }
};
