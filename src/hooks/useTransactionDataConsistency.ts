
import { useMemo } from 'react';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { transactionDataValidator, ValidationResult } from '@/services/dealStructuring/transactionDataValidator';

export const useTransactionDataConsistency = (results: AnalysisResults) => {
  const validation = useMemo(() => {
    return transactionDataValidator.validateConsistency(results);
  }, [results]);

  const extractedData = useMemo(() => {
    return {
      considerationAmount: transactionDataValidator.extractConsiderationAmount(results),
      ownershipPercentages: transactionDataValidator.extractOwnershipPercentages(results),
      entityNames: transactionDataValidator.extractEntityNames(results)
    };
  }, [results]);

  return {
    validation,
    extractedData,
    isConsistent: validation.isValid && validation.warnings.length === 0
  };
};
