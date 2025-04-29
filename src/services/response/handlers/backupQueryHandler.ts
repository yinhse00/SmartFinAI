
import { GrokResponse } from '@/types/grok';
import { responseGeneratorCore } from '../core/responseGeneratorCore';

/**
 * Handles backup API calls when primary calls fail
 */
export const backupQueryHandler = {
  /**
   * Make a backup API call with simplified parameters
   */
  processBackup: async (
    prompt: string,
    queryType: string,
    apiKey: string,
    requestId: string,
    isProduction: boolean
  ): Promise<GrokResponse> => {
    try {
      const startTime = Date.now();
      const backupResponse = await responseGeneratorCore.makeBackupApiCall(
        prompt, 
        queryType, 
        apiKey
      );
      const responseTime = Date.now() - startTime;
      console.log(`Backup API response received in ${responseTime}ms for request ${requestId}`);
      
      // Add environment metadata for debugging
      if (!backupResponse.metadata) {
        backupResponse.metadata = {};
      }
      
      backupResponse.metadata.environmentInfo = {
        requestId,
        isProduction,
        envSignature: 'unified-env-2.0',
        processingTime: responseTime,
        isBackupResponse: true
      };
      
      return backupResponse;
    } catch (error) {
      throw error;
    }
  }
};
