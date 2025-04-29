
// Re-export functions from the refactored modules
import { extractChapter, detectChapter, parseRegulatoryText } from './import/parseUtils';
import { extractDefinitions } from './import/definitionUtils';
import { importRegulatoryContent } from './import/importService';
import type { ImportResult } from './import/importService';

export {
  extractChapter,
  detectChapter,
  parseRegulatoryText,
  extractDefinitions,
  importRegulatoryContent,
  ImportResult
};
