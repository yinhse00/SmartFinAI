
import { RegulatoryEntry } from '../types';
import { SearchResult } from './types';
import { basicSearch } from './basicSearch';
import { comprehensiveSearch } from './comprehensiveSearch';

/**
 * Service for searching the regulatory database
 */
export const searchService = {
  /**
   * Search the regulatory database
   */
  search: basicSearch.search,

  /**
   * Search the regulatory database specifically by title
   */
  searchByTitle: basicSearch.searchByTitle,

  /**
   * Get regulatory entries by their source IDs
   */
  getEntriesBySourceIds: basicSearch.getEntriesBySourceIds,

  /**
   * Search both in-memory database and reference documents
   */
  searchComprehensive: comprehensiveSearch.searchComprehensive
};
