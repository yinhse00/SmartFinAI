
/**
 * Interface for document processor implementations
 */
export interface DocumentProcessorInterface {
  extractText: (file: File) => Promise<{ content: string; source: string }>;
}
