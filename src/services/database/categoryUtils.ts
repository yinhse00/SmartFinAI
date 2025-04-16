
export function determineCategory(filename: string): RegulatoryEntry['category'] {
  const lowerFilename = filename.toLowerCase();
  
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
