import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { CorporateEntity } from '@/types/dealStructuring';

export interface EntityNames {
  targetCompanyName: string;
  acquiringCompanyName: string;
  isAcquirerListed: boolean;
}

export const generateEntityId = (type: string, name: string, prefix: string): string => {
  const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
  return `${prefix}-${type}-${sanitizedName}`.toLowerCase();
};

export const extractEntityNames = (results: AnalysisResults): EntityNames => {
  let targetCompanyName = 'Target Company';
  const targetEntityFromCS = results.corporateStructure?.entities?.find(e => e.type === 'target');
  if (targetEntityFromCS) {
    targetCompanyName = targetEntityFromCS.name;
  } else if (results.corporateStructure?.targetEntities && results.corporateStructure.targetEntities.length > 0) {
    // Assuming targetEntities contains the name of the primary target
    targetCompanyName = results.corporateStructure.targetEntities[0];
  }

  let acquiringCompanyName = 'Acquiring Company';
  let isAcquirerListed = false;

  // 1. Specific transaction type pattern indicating a known acquirer name and status
  // This handles the specific case from previous prompts like "Listed Company acquires Target Company"
  if (results.transactionType === "Listed Company acquires Target Company") {
    acquiringCompanyName = "Listed Company";
    isAcquirerListed = true;
  } else {
    // 2. Try to infer from corporateStructure.mainIssuer (if it's not the target itself)
    if (results.corporateStructure?.mainIssuer) {
      const issuerEntity = results.corporateStructure.entities?.find(
        e => (e.id === results.corporateStructure.mainIssuer || e.name === results.corporateStructure.mainIssuer) && e.name !== targetCompanyName
      );
      if (issuerEntity) {
        acquiringCompanyName = issuerEntity.name;
        isAcquirerListed = true; // mainIssuer is generally considered a listed entity
      }
    }

    // 3. If not found via mainIssuer, try any other 'issuer' entity in corporateStructure (if it's not the target)
    if (acquiringCompanyName === 'Acquiring Company') { // Only if not already identified
      const potentialAcquirerIssuer = results.corporateStructure?.entities?.find(
        e => e.type === 'issuer' && e.name !== targetCompanyName
      );
      if (potentialAcquirerIssuer) {
        acquiringCompanyName = potentialAcquirerIssuer.name;
        isAcquirerListed = true; // 'issuer' type implies listed status
      }
    }
    
    // 4. General hints from transactionType if acquirer is still default or its listed status isn't confirmed
    // This sets `isAcquirerListed` if the transactionType strongly implies it, even if the name is generic.
    if (results.transactionType?.toLowerCase().includes('listed company') &&
        (results.transactionType?.toLowerCase().includes('acquire') || results.transactionType?.toLowerCase().includes('acquisition'))) {
      // If the transaction type clearly indicates a listed company is acquiring, set the flag.
      // The acquiringCompanyName might be specific (if found above) or remain generic ('Acquiring Company').
      isAcquirerListed = true;
    }
  }

  console.log("Extracted Entity Names (v3 logic):", { targetCompanyName, acquiringCompanyName, isAcquirerListed });
  return { targetCompanyName, acquiringCompanyName, isAcquirerListed };
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
