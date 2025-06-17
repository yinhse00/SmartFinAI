
import { useMemo } from 'react';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator, ValidationResult } from '@/services/dealStructuring/transactionDataValidator';
import { dataConsistencyService } from '@/services/dealStructuring/dataConsistencyService';

export const useTransactionDataConsistency = (results: AnalysisResults) => {
  const validation = useMemo(() => {
    return transactionDataValidator.validateConsistency(results);
  }, [results]);

  const extractedData = useMemo(() => {
    // Use the centralized data consistency service
    const consistentData = dataConsistencyService.extractConsistentData(results);
    
    return {
      considerationAmount: consistentData.considerationAmount,
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
  }, [results]);

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
