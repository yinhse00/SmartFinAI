
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { CorporateEntity } from '@/types/dealStructuring';

export const generateEntityId = (type: string, name:string, prefix: string): string => {
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
  return `${prefix}-${type.toLowerCase()}-${sanitizedName}`;
};

export const extractEntityNames = (results: AnalysisResults): {
  targetCompanyName: string;
  acquiringCompanyName: string;
  isAcquirerListed: boolean;
} => {
  let targetName = 'Target Company';
  let acquirerName = 'Acquiring Company';
  let isAcquirerListedCompany = false;

  const entities = results.corporateStructure?.entities;

  if (entities && entities.length > 0) {
    // Rule 1: Explicit 'target' type
    const explicitTarget = entities.find(e => e.type === 'target');
    if (explicitTarget) {
      targetName = explicitTarget.name;
    }

    // Rule 2: Identify Acquirer - could be 'parent', 'issuer', or named like one
    let potentialAcquirers = entities.filter(e =>
      e.type === 'parent' ||
      e.type === 'issuer' ||
      e.name.toLowerCase().includes('acquir') ||
      e.name.toLowerCase().includes('buyer') ||
      e.name.toLowerCase().includes('purchas') ||
      e.name.toLowerCase().includes('listed co') || // Check for listed company
      e.name.toLowerCase().includes('holding')
    );

    // Filter out the target if it was accidentally included
    potentialAcquirers = potentialAcquirers.filter(e => e.name !== targetName);

    if (potentialAcquirers.length > 0) {
      // Prefer 'issuer' or 'parent' type if available and not the target
      const primaryAcquirer = potentialAcquirers.find(e => e.type === 'issuer' || e.type === 'parent') || potentialAcquirers[0];
      acquirerName = primaryAcquirer.name;
      if (primaryAcquirer.type === 'issuer' || primaryAcquirer.name.toLowerCase().includes('listed co')) {
        isAcquirerListedCompany = true;
      }
    }
    
    // If target is still default and there's only one clear non-acquirer, it might be the target.
    if (targetName === 'Target Company' && entities.length > 0 && acquirerName !== 'Acquiring Company') {
        const otherEntities = entities.filter(e => e.name !== acquirerName);
        if (otherEntities.length === 1) {
            targetName = otherEntities[0].name;
        } else if (results.dealEconomics?.targetPercentage && otherEntities.length > 1) {
            // Try to find target based on common naming if dealEconomics hints at acquisition
            const possibleTargetByName = otherEntities.find(e => !e.name.toLowerCase().includes('acquir') && !e.name.toLowerCase().includes('buyer') && !e.name.toLowerCase().includes('purchas') && e.type !== 'parent' && e.type !== 'issuer');
            if (possibleTargetByName) targetName = possibleTargetByName.name;
        }
    }


  } else { // Fallback to old logic if no corporate structure entities
    if (results.shareholding?.after) {
        const potentialAcquirerFromShareholding = results.shareholding.after.find(
          holder => holder.percentage > (results.dealEconomics?.targetPercentage || 50) - 5 &&
                    (holder.name.toLowerCase().includes('acquir') ||
                     holder.name.toLowerCase().includes('buyer') ||
                     holder.name.toLowerCase().includes('purchas'))
        );
        if (potentialAcquirerFromShareholding) acquirerName = potentialAcquirerFromShareholding.name;
      }
  }
  
  // Ensure acquirer and target are not the same if they were ambiguously identified
  if (targetName === acquirerName && targetName !== 'Target Company') {
      if (entities && entities.length > 1) {
          const alternativeTarget = entities.find(e => e.name !== acquirerName && e.type === 'target');
          const alternativeAcquirer = entities.find(e => e.name !== targetName && (e.type === 'parent' || e.type === 'issuer'));
          
          if (alternativeTarget) targetName = alternativeTarget.name;
          else if (alternativeAcquirer) acquirerName = alternativeAcquirer.name;
          else {
            // If still conflict, make a sensible default.
            // This might happen if only one entity named "Acquirer" and it's also marked target.
            // Reset target to default and hope other logic picks it up or user clarifies.
            targetName = "Target Company Default"; 
          }
      }
  }


  console.log(`Extracted Entity Names: Target - ${targetName}, Acquirer - ${acquirerName}, Acquirer is Listed - ${isAcquirerListedCompany}`);
  return { targetCompanyName: targetName, acquiringCompanyName: acquirerName, isAcquirerListed: isAcquirerListedCompany };
};

export const identifyAcquirer = (
  holder: { name: string; percentage: number },
  results: AnalysisResults,
  extractedAcquirerName: string,
  corporateEntities?: CorporateEntity[]
): boolean => {
  const holderNameLower = holder.name.toLowerCase();
  const extractedAcquirerNameLower = extractedAcquirerName.toLowerCase();

  // Direct name match with the explicitly extracted acquirer company name
  if (holder.name === extractedAcquirerName) return true;

  // Check if the holder is identified as the 'issuer' or 'parent' in the corporate structure
  // and its name matches the holder's name.
  if (corporateEntities) {
    const corporateMatch = corporateEntities.find(
      (ce) => ce.name === holder.name && (ce.type === 'issuer' || ce.type === 'parent')
    );
    if (corporateMatch) return true;
  }

  // Keywords suggesting acquirer role
  if (
    holderNameLower.includes('acquir') ||
    holderNameLower.includes('buyer') ||
    holderNameLower.includes('purchas') ||
    holderNameLower.includes('listed co')
  ) {
    return true;
  }

  // If the holder's name matches the extracted acquirer name (case-insensitive)
  // This is particularly for shareholding list where names might differ slightly in case
  if (holderNameLower === extractedAcquirerNameLower) return true;
  
  // High percentage ownership, potentially indicating control or primary new owner
  // This is a more general heuristic and should be applied cautiously
  if (holder.percentage > 75) { // Increased threshold to be more specific
      // Check if this high-percentage holder is NOT the target itself (if target name is known)
      if(results.corporateStructure?.entities) {
          const targetEntity = results.corporateStructure.entities.find(e => e.type === 'target');
          if(targetEntity && holder.name === targetEntity.name) return false; // Not an acquirer if it's the target
      }
      return true;
  }
  
  // If deal economics indicate a target percentage, and this holder matches that closely
  if (results.dealEconomics?.targetPercentage &&
      Math.abs(holder.percentage - results.dealEconomics.targetPercentage) < 5 &&
      results.dealEconomics.targetPercentage > 50) { // Ensure it's a significant stake
    return true;
  }

  return false;
};
