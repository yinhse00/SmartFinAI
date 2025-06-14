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
  let targetName = 'Target Company'; // Default
  let acquirerName = 'Acquiring Company'; // Default
  let isAcquirerListedCompany = false;

  const entities = results.corporateStructure?.entities;

  if (entities && entities.length > 0) {
    // Rule 1: Explicit 'target' type
    const explicitTarget = entities.find(e => e.type === 'target');
    if (explicitTarget) {
      targetName = explicitTarget.name;
      console.log(`Explicit target found: ${targetName}`);
    }

    // Rule 2: Identify Acquirer
    // Prioritize 'issuer', then 'parent', then name heuristics, ensuring it's not the target.
    let potentialAcquirers = entities.filter(e => e.name !== targetName); // Exclude the already identified target

    const issuerAcquirer = potentialAcquirers.find(e => e.type === 'issuer');
    if (issuerAcquirer) {
      acquirerName = issuerAcquirer.name;
      isAcquirerListedCompany = true;
      console.log(`Issuer acquirer found: ${acquirerName}`);
    } else {
      const parentAcquirer = potentialAcquirers.find(e => e.type === 'parent');
      if (parentAcquirer) {
        acquirerName = parentAcquirer.name;
        // Check if parent is also listed (e.g., "Listed Co Parent")
        if (parentAcquirer.name.toLowerCase().includes('listed co') || parentAcquirer.name.toLowerCase().includes('issuer')) {
            isAcquirerListedCompany = true;
        }
        console.log(`Parent acquirer found: ${acquirerName}`);
      } else {
        // Fallback to name heuristics if no clear 'issuer' or 'parent' acquirer
        const namedAcquirers = potentialAcquirers.filter(e =>
          e.name.toLowerCase().includes('acquir') ||
          e.name.toLowerCase().includes('buyer') ||
          e.name.toLowerCase().includes('purchas') ||
          e.name.toLowerCase().includes('listed co') ||
          e.name.toLowerCase().includes('holding')
        );
        if (namedAcquirers.length > 0) {
          acquirerName = namedAcquirers[0].name; // Take the first match
          if (namedAcquirers[0].type === 'issuer' || namedAcquirers[0].name.toLowerCase().includes('listed co')) {
            isAcquirerListedCompany = true;
          }
          console.log(`Named acquirer found: ${acquirerName}`);
        }
      }
    }

    // If target is still default and acquirer identified, try to find a non-acquirer entity as target.
    if (targetName === 'Target Company' && acquirerName !== 'Acquiring Company') {
      const otherEntities = entities.filter(e => e.name !== acquirerName && e.type !== 'parent' && e.type !== 'issuer');
      if (otherEntities.length === 1 && !otherEntities[0].name.toLowerCase().includes('acquir')) {
        targetName = otherEntities[0].name;
        console.log(`Inferred target (single other): ${targetName}`);
      } else if (otherEntities.length > 0) {
        // If multiple others, look for one that doesn't seem like an acquirer/parent
        const mostLikelyTarget = otherEntities.find(e => 
            !e.name.toLowerCase().includes('acquir') &&
            !e.name.toLowerCase().includes('buyer') &&
            !e.name.toLowerCase().includes('purchas') &&
            !e.name.toLowerCase().includes('listed co') &&
            !e.name.toLowerCase().includes('holding') &&
            e.type !== 'parent' && e.type !== 'issuer'
        ) || otherEntities.find(e => e.type === 'subsidiary'); // A subsidiary could be a target
        
        if (mostLikelyTarget) {
            targetName = mostLikelyTarget.name;
            console.log(`Inferred target (most likely): ${targetName}`);
        }
      }
    }
     // If targetName is still default and results.dealEconomics?.targetPercentage exists, try to infer from there
     if (targetName === 'Target Company' && results.dealEconomics?.targetPercentage && entities.length > 1) {
        const potentialTargetsByName = entities.filter(e => 
            e.name !== acquirerName && // not the acquirer
            e.type !== 'parent' && e.type !== 'issuer' && // not typically acquirer types
            !e.name.toLowerCase().includes('acquir') && // does not sound like an acquirer
            !e.name.toLowerCase().includes('listed co')
        );
        if (potentialTargetsByName.length === 1) {
            targetName = potentialTargetsByName[0].name;
            console.log(`Inferred target by elimination: ${targetName}`);
        } else if (potentialTargetsByName.find(e => e.name.toLowerCase().includes('target'))) {
            targetName = potentialTargetsByName.find(e => e.name.toLowerCase().includes('target'))!.name;
            console.log(`Inferred target by name "target": ${targetName}`);
        }
    }


  } else { // Fallback to old logic if no corporate structure entities (less relevant for current complex case)
    // ... keep existing code (fallback logic using shareholding)
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
  
  // Final sanity check: acquirer and target should not be the same if we have distinct info.
  if (targetName === acquirerName && targetName !== 'Target Company' /* meaning a specific name was picked for both */) {
    console.warn(`Conflict: Target and Acquirer identified as same entity: ${targetName}. Attempting to resolve.`);
    // Attempt to re-evaluate if possible, or reset one to default if only one entity was provided.
    const explicitTarget = entities?.find(e => e.type === 'target');
    const explicitIssuer = entities?.find(e => e.type === 'issuer');

    if (explicitTarget && explicitIssuer && explicitTarget.name !== explicitIssuer.name) {
        targetName = explicitTarget.name;
        acquirerName = explicitIssuer.name;
        isAcquirerListedCompany = true;
        console.log(`Resolved conflict: Target=${targetName}, Acquirer=${acquirerName}`);
    } else if (entities?.length === 1) {
        // If only one entity, it can't be both target and acquirer in a typical M&A.
        // This case is ambiguous. Defaulting based on common scenario.
        // If transaction type implies acquisition, it's the target.
        if (results.transactionType?.toLowerCase().includes('acquisition')) {
            targetName = entities[0].name;
            acquirerName = 'External Acquirer'; // Placeholder
            console.log(`Resolved conflict (single entity, acquisition): Target=${targetName}, Acquirer=${acquirerName}`);
        } else {
            acquirerName = entities[0].name; // e.g. for capital raising by this entity
            targetName = 'N/A'; 
            console.log(`Resolved conflict (single entity, non-acquisition): Acquirer=${acquirerName}`);
        }
    } else {
        // If multiple entities but still conflict, try to find alternatives.
        const alternativeTarget = entities?.find(e => e.type === 'target' && e.name !== acquirerName);
        const alternativeAcquirer = entities?.find(e => (e.type === 'issuer' || e.type === 'parent') && e.name !== targetName);

        if (alternativeTarget) {
            targetName = alternativeTarget.name;
            console.log(`Conflict resolution: Alternative target found: ${targetName}`);
        } else if (alternativeAcquirer) {
            acquirerName = alternativeAcquirer.name;
            isAcquirerListedCompany = (alternativeAcquirer.type === 'issuer' || alternativeAcquirer.name.toLowerCase().includes('listed co'));
            console.log(`Conflict resolution: Alternative acquirer found: ${acquirerName}`);
        } else {
            console.warn(`Could not resolve name conflict for ${targetName}. One might be misidentified.`);
            // Reset target to default if acquirer seems more specific (e.g. "Listed Co")
            if (acquirerName.toLowerCase().includes('listed co') || acquirerName.toLowerCase().includes('acquir')) {
                targetName = 'Target Company'; 
            } else {
                acquirerName = 'Acquiring Company';
            }
        }
    }
  }

  console.log(`FINAL Extracted Entity Names: Target - ${targetName}, Acquirer - ${acquirerName}, Acquirer is Listed - ${isAcquirerListedCompany}`);
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
  if (holder.name === extractedAcquirerName) {
    console.log(`identifyAcquirer: Direct match for ${holder.name} as extracted acquirer ${extractedAcquirerName}`);
    return true;
  }

  // Check if the holder is marked as 'issuer' or 'parent' in corporate structure
  // AND its name aligns with the extracted acquirer name.
  // This helps confirm if a corporate entity is acting as the acquirer in shareholding.
  if (corporateEntities) {
    const corporateMatch = corporateEntities.find(
      (ce) => ce.name === holder.name && (ce.type === 'issuer' || ce.type === 'parent')
    );
    if (corporateMatch && holder.name === extractedAcquirerName) {
      console.log(`identifyAcquirer: Corporate match for ${holder.name} as ${corporateMatch.type} and extracted acquirer ${extractedAcquirerName}`);
      return true;
    }
  }

  // Keywords suggesting acquirer role, BUT only if it matches the extractedAcquirerName.
  // This avoids marking a random "Holding Co" as acquirer if the main acquirer is "BigCorp Inc".
  const acquirerKeywords = ['acquir', 'buyer', 'purchas', 'listed co'];
  if (acquirerKeywords.some(keyword => holderNameLower.includes(keyword)) && holderNameLower === extractedAcquirerNameLower) {
    console.log(`identifyAcquirer: Keyword match for ${holder.name} and it is the extracted acquirer ${extractedAcquirerName}`);
    return true;
  }
  
  // This function is primarily for determining if a shareholder *entry* in the target's shareholding list
  // represents the main acquiring *entity*. Individual shareholders of the acquiring entity (like "Shareholder A" for "Listed Company")
  // should not be flagged as *the* acquirer by this function if `extractedAcquirerName` is "Listed Company".
  // The logic below needs to be careful not to misidentify.
  // For instance, if `extractedAcquirerName` is "Listed Company", and `holder.name` is "Shareholder A", it should be false.

  // If the holder's name matches the extracted acquirer name (case-insensitive)
  // This helps in shareholding lists where casing might differ slightly.
  if (holderNameLower === extractedAcquirerNameLower) {
    console.log(`identifyAcquirer: Case-insensitive match for ${holder.name} as extracted acquirer ${extractedAcquirerName}`);
    return true;
  }
  
  // High percentage ownership is tricky. If "Listed Company" acquires 100%, and "Shareholder A" owns 75% of "Listed Company",
  // "Shareholder A" should NOT be marked as the acquirer of the TARGET.
  // This heuristic is now removed as it can be misleading in multi-level structures.
  /*
  if (holder.percentage > 75) { 
      // Check if this high-percentage holder is NOT the target itself
      const targetEntity = results.corporateStructure?.entities?.find(e => e.type === 'target');
      if(targetEntity && holder.name === targetEntity.name) return false; 
      
      // Check if this high-percentage holder is NOT just a major shareholder of the actual acquirer
      if (holder.name !== extractedAcquirerName && corporateEntities?.find(ce => ce.name === extractedAcquirerName && ce.type !== 'target')) { // if there's a distinct corporate acquirer
          console.log(`identifyAcquirer: ${holder.name} has high percentage, but is not the extracted acquirer ${extractedAcquirerName}. Not flagging as acquirer.`);
          return false; 
      }
      console.log(`identifyAcquirer: High percentage for ${holder.name} and it MIGHT be the acquirer (or matches extracted).`);
      return true; // Or return holderNameLower === extractedAcquirerNameLower;
  }
  */
  
  // If deal economics indicate a target percentage, and this holder matches that closely, AND it's the extracted acquirer name.
  if (results.dealEconomics?.targetPercentage &&
      Math.abs(holder.percentage - results.dealEconomics.targetPercentage) < 5 &&
      results.dealEconomics.targetPercentage > 50 &&
      holderNameLower === extractedAcquirerNameLower) {
    console.log(`identifyAcquirer: Deal economics match for ${holder.name} as extracted acquirer ${extractedAcquirerName}`);
    return true;
  }

  // console.log(`identifyAcquirer: ${holder.name} did not match criteria for acquirer ${extractedAcquirerName}`);
  return false;
};
