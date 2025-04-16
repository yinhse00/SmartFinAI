

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

export interface ReferenceDocument {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  file_url: string;
  file_size: number | null;
  created_at: string;
  updated_at?: string;
}

