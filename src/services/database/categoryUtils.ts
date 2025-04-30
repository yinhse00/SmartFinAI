
import { DocumentCategory } from "@/types/references";

export function determineCategory(filename: string): DocumentCategory {
  const lowerFilename = filename.toLowerCase();
  
  // Check for main categories
  if (lowerFilename.includes('listing rules') || lowerFilename.match(/chapter\s+\d+/) || lowerFilename.match(/ch\d+/)) {
    return 'listing_rules';
  }
  
  // Check for guidance categories
  if (lowerFilename.includes('guidance') || lowerFilename.includes('note') || lowerFilename.includes('interpretation')) {
    if (lowerFilename.includes('new listing') || lowerFilename.includes('applicant')) {
      return 'guidance_new_listing';
    } else if (lowerFilename.includes('listed issuer')) {
      return 'guidance_listed_issuers';
    }
    return 'listing_guidance';
  }
  
  if (lowerFilename.includes('takeover') || lowerFilename.includes('takeovers')) {
    return 'takeovers';
  }
  
  if (lowerFilename.includes('decision') || lowerFilename.includes('review committee')) {
    return 'decisions';
  }
  
  if (lowerFilename.includes('checklist') || lowerFilename.includes('form') || lowerFilename.includes('template')) {
    return 'checklists';
  }
  
  return 'other';
}
