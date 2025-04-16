
export type DocumentCategory = 
  | 'listing_rules'
  | 'takeovers'
  | 'guidance'
  | 'decisions'
  | 'checklists'
  | 'other';

export const categoryDisplayNames: Record<DocumentCategory, string> = {
  listing_rules: 'Listing Rules',
  takeovers: 'Takeovers Code',
  guidance: 'Interpretation and Guidance',
  decisions: 'Listing Review Committee Decisions',
  checklists: 'Checklists, Forms and Templates',
  other: 'Others'
};
