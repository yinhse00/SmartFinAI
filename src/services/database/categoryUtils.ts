
import { DocumentCategory } from "@/types/references";

export function determineCategory(filename: string): DocumentCategory {
  const lowerFilename = filename.toLowerCase();
  
  // Check for specific chapter patterns first
  if (lowerFilename.includes('chapter 13') || lowerFilename.includes('ch13') || lowerFilename.includes('13.')) {
    return 'chapter_13';
  }
  
  if (lowerFilename.includes('chapter 14a') || lowerFilename.includes('ch14a')) {
    return 'chapter_14a';
  }
  
  if (lowerFilename.includes('chapter 14') || lowerFilename.includes('ch14')) {
    return 'chapter_14';
  }
  
  // Then check for more general categories
  if (lowerFilename.includes('listing') || lowerFilename.includes('listing rules')) {
    return 'listing_rules';
  }
  
  if (lowerFilename.includes('takeover') || lowerFilename.includes('takeovers')) {
    return 'takeovers';
  }
  
  if (lowerFilename.includes('guidance') || lowerFilename.includes('note') || lowerFilename.includes('interpretation')) {
    return 'guidance';
  }
  
  if (lowerFilename.includes('decision') || lowerFilename.includes('review committee')) {
    return 'decisions';
  }
  
  if (lowerFilename.includes('checklist') || lowerFilename.includes('form') || lowerFilename.includes('template')) {
    return 'checklists';
  }
  
  return 'other';
}
