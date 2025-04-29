
import { RegulatoryEntry } from '../types';
import { DocumentCategory } from '@/types/references';
import { ReferenceDocument } from '@/types/references';

export interface SearchResult {
  databaseEntries: RegulatoryEntry[];
  referenceDocuments: ReferenceDocument[];
}
