
export type DocumentCategory = 
  | 'listing_rules'
  | 'listing_guidance' 
  | 'guidance_new_listing'
  | 'guidance_listed_issuers'
  | 'takeovers'
  | 'decisions'
  | 'checklists'
  | 'other';

export const categoryDisplayNames: Record<DocumentCategory, string> = {
  listing_rules: 'Listing Rules',
  listing_guidance: 'Listing Rules Guidance',
  guidance_new_listing: 'Guide for New Listing Applicants',
  guidance_listed_issuers: 'Guidance for Listed Issuers',
  takeovers: 'Takeovers Code',
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
