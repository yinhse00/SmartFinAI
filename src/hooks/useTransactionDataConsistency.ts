
import { useMemo } from 'react';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator, ValidationResult } from '@/services/dealStructuring/transactionDataValidator';
import { dataConsistencyService } from '@/services/dealStructuring/dataConsistencyService';
import { ExtractedUserInputs } from '@/services/dealStructuring/enhancedAiAnalysisService';

export const useTransactionDataConsistency = (results: AnalysisResults, userInputs?: ExtractedUserInputs) => {
  const validation = useMemo(() => {
    return transactionDataValidator.validateConsistency(results);
  }, [results]);

  const extractedData = useMemo(() => {
    // Use the centralized data consistency service with userInputs
    const consistentData = dataConsistencyService.extractConsistentData(results, userInputs);
    
    console.log('=== useTransactionDataConsistency ===');
    console.log('UserInputs received:', userInputs);
    console.log('Consistent data extracted:', consistentData);
    
    return {
      considerationAmount: consistentData.considerationAmount,
      targetValuation: consistentData.targetValuation,
      ownershipPercentages: {
        acquisitionPercentage: consistentData.acquisitionPercentage,
        remainingPercentage: 100 - consistentData.acquisitionPercentage
      },
      entityNames: {
        targetCompanyName: consistentData.targetCompanyName,
        acquiringCompanyName: consistentData.acquiringCompanyName
      },
      currency: consistentData.currency,
      source: consistentData.source
    };
  }, [results, userInputs]);

  const consistencyCheck = useMemo(() => {
    return dataConsistencyService.validateDataConsistency(results);
  }, [results]);

  return {
    validation,
    extractedData,
    consistencyCheck,
    isConsistent: validation.isValid && validation.warnings.length === 0 && consistencyCheck.isConsistent
  };
};
