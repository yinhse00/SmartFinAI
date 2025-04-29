
export type DocumentCategory = 
  | 'listing_rules'
  | 'chapter_13'
  | 'chapter_14'
  | 'chapter_14a'
  | 'takeovers'
  | 'guidance'
  | 'decisions'
  | 'checklists'
  | 'other';

export const categoryDisplayNames: Record<DocumentCategory, string> = {
  listing_rules: 'Listing Rules',
  chapter_13: 'Chapter 13 - Connected Transactions',
  chapter_14: 'Chapter 14 - Notifiable Transactions',
  chapter_14a: 'Chapter 14A - Connected Transactions',
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
