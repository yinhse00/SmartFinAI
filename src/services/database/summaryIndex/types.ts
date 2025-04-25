
import { RegulatoryEntry } from '../types';

export interface SearchResult {
  found: boolean;
  context?: string;
  sourceIds?: string[];
}

export interface SummarySearchOptions {
  threshold?: number;
  maxResults?: number;
}

