
import { RegulatoryEntry } from '../types';
import { ReferenceDocument } from '@/types/references';

export interface SearchResults {
  databaseEntries: RegulatoryEntry[];
  referenceDocuments: ReferenceDocument[];
}

export interface ReferenceSearchResults {
  referenceDocuments: ReferenceDocument[];
}

export interface ScoredEntry<T> {
  entry: T;
  score: number;
}

export interface SearchOptions {
  fuzzyMatching?: boolean;
  fuzzyThreshold?: number;
  includePartialMatches?: boolean;
  maxResults?: number;
  sortByRelevance?: boolean;
}
