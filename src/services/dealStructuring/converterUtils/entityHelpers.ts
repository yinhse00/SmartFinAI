
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';

export const generateEntityId = (type: string, name: string, prefix: string): string => {
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
  return `${prefix}-${type.toLowerCase()}-${sanitizedName}`;
};

export const extractEntityNames = (results: AnalysisResults): {
  targetCompanyName: string;
  acquiringCompanyName: string;
} => {
  let targetName = 'Target Company';
  let acquirerName = 'Acquiring Company';

  if (results.corporateStructure?.entities) {
    const targetEntity = results.corporateStructure.entities.find(e => e.type === 'target');
    if (targetEntity) targetName = targetEntity.name;

    const acquirerEntity = results.corporateStructure.entities.find(e =>
      e.type === 'parent' || e.type === 'issuer' ||
      e.name.toLowerCase().includes('acquir') ||
      e.name.toLowerCase().includes('buyer') ||
      e.name.toLowerCase().includes('purchas')
    );
    if (acquirerEntity) acquirerName = acquirerEntity.name;
  }

  if (targetName === 'Target Company' && results.dealEconomics?.targetPercentage) {
    // Further logic might be needed if target is not in corporate structure
  }

  if (acquirerName === 'Acquiring Company' && results.shareholding?.after) {
    const potentialAcquirer = results.shareholding.after.find(
      holder => holder.percentage > (results.dealEconomics?.targetPercentage || 50) - 5 &&
                (holder.name.toLowerCase().includes('acquir') ||
                 holder.name.toLowerCase().includes('buyer') ||
                 holder.name.toLowerCase().includes('purchas'))
    );
    if (potentialAcquirer) acquirerName = potentialAcquirer.name;
  }

  console.log(`Extracted Entity Names: Target - ${targetName}, Acquirer - ${acquirerName}`);
  return { targetCompanyName: targetName, acquiringCompanyName: acquirerName };
};

export const identifyAcquirer = (holder: any, results: AnalysisResults, extractedAcquirerName: string): boolean => {
  const name = holder.name.toLowerCase();
  if (holder.name === extractedAcquirerName) return true;

  const percentage = holder.percentage;

  if (name.includes('acquir') || name.includes('buyer') || name.includes('purchas')) {
    return true;
  }

  if (percentage > 50) {
    return true;
  }

  if (results.dealEconomics?.targetPercentage &&
      Math.abs(percentage - results.dealEconomics.targetPercentage) < 5) {
    return true;
  }

  return false;
};
