
/**
 * Type definitions for regulatory database entries
 */

export interface RegulatoryEntry {
  id: string;
  title: string;
  content: string;
  category: 'listing_rules' | 'takeovers' | 'guidance' | 'precedents' | 'other';
  source: string;
  section?: string;
  lastUpdated: Date;
  status: 'active' | 'under_review' | 'archived';
}

