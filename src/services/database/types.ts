
/**
 * Type definitions for regulatory database entries
 */
import { DocumentCategory } from "@/types/references";

export interface RegulatoryEntry {
  id: string;
  title: string;
  content: string;
  category: DocumentCategory;
  source: string;
  section?: string;
  lastUpdated: Date;
  status: 'active' | 'under_review' | 'archived';
}
