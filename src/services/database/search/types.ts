
import { RegulatoryEntry } from '../types';
import { ReferenceDocument } from '@/types/references';

export interface SearchResults {
  databaseEntries: RegulatoryEntry[];
  referenceDocuments: ReferenceDocument[];
}

export interface ReferenceSearchResults {
  referenceDocuments: ReferenceDocument[];
}
