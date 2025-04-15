
export interface ReferenceDocument {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_path: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export type DocumentCategory = 
  | 'listing_rules'
  | 'takeovers'
  | 'guidance'
  | 'decisions'
  | 'precedents'
  | 'other';

export const categoryDisplayNames: Record<DocumentCategory, string> = {
  listing_rules: 'Listing Rules',
  takeovers: 'Takeovers Code',
  guidance: 'Guidance Notes',
  decisions: 'Executive Decisions',
  precedents: 'Precedent Cases',
  other: 'Other'
};
