/**
 * WordService - Office.js wrapper for reading and writing to Word documents
 * Handles Track Changes, Comments, and document manipulation
 */

export interface DocumentContent {
  text: string;
  language: 'en' | 'zh' | 'mixed';
  wordCount: number;
  paragraphCount: number;
}

export interface TextRange {
  text: string;
  start: number;
  end: number;
}

export class WordService {
  private static instance: WordService;
  
  private constructor() {}
  
  static getInstance(): WordService {
    if (!WordService.instance) {
      WordService.instance = new WordService();
    }
    return WordService.instance;
  }

  /**
   * Initialize Office.js and ensure it's ready
   */
  async initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof Office !== 'undefined' && Office.context) {
        Office.onReady((info) => {
          if (info.host === Office.HostType.Word) {
            console.log('Word Add-in initialized successfully');
            resolve(true);
          } else {
            console.error('Not running in Word');
            resolve(false);
          }
        });
      } else {
        console.error('Office.js not loaded');
        resolve(false);
      }
    });
  }

  /**
   * Get the entire document content
   */
  async getDocumentContent(): Promise<DocumentContent> {
    return Word.run(async (context) => {
      const body = context.document.body;
      body.load('text');
      
      const paragraphs = body.paragraphs;
      paragraphs.load('items');
      
      await context.sync();
      
      const text = body.text;
      const language = this.detectLanguage(text);
      const wordCount = this.countWords(text);
      const paragraphCount = paragraphs.items.length;
      
      return {
        text,
        language,
        wordCount,
        paragraphCount
      };
    });
  }

  /**
   * Get currently selected text
   */
  async getSelectedText(): Promise<string> {
    return Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load('text');
      await context.sync();
      return selection.text;
    });
  }

  /**
   * Apply a track change (find and replace with revision marking)
   */
  async applyTrackChange(
    searchText: string, 
    replacementText: string,
    comment?: string
  ): Promise<boolean> {
    return Word.run(async (context) => {
      // Enable track changes
      context.document.body.track();
      
      // Search for the text
      const searchResults = context.document.body.search(searchText, {
        matchCase: false,
        matchWholeWord: false
      });
      
      searchResults.load('items');
      await context.sync();
      
      if (searchResults.items.length === 0) {
        console.warn(`Text not found: "${searchText.substring(0, 50)}..."`);
        return false;
      }
      
      // Replace the first occurrence
      const range = searchResults.items[0];
      range.insertText(replacementText, Word.InsertLocation.replace);
      
      // Add comment if provided
      if (comment) {
        range.insertComment(comment);
      }
      
      await context.sync();
      console.log(`Track change applied: "${searchText.substring(0, 30)}..." → "${replacementText.substring(0, 30)}..."`);
      return true;
    }).catch((error) => {
      console.error('Error applying track change:', error);
      return false;
    });
  }

  /**
   * Add a comment to specific text
   */
  async addComment(searchText: string, commentText: string): Promise<boolean> {
    return Word.run(async (context) => {
      const searchResults = context.document.body.search(searchText, {
        matchCase: false,
        matchWholeWord: false
      });
      
      searchResults.load('items');
      await context.sync();
      
      if (searchResults.items.length === 0) {
        console.warn(`Text not found for comment: "${searchText.substring(0, 50)}..."`);
        return false;
      }
      
      const range = searchResults.items[0];
      range.insertComment(commentText);
      
      await context.sync();
      console.log(`Comment added to: "${searchText.substring(0, 30)}..."`);
      return true;
    }).catch((error) => {
      console.error('Error adding comment:', error);
      return false;
    });
  }

  /**
   * Highlight text temporarily (for preview)
   */
  async highlightText(searchText: string, highlight: boolean = true): Promise<boolean> {
    return Word.run(async (context) => {
      const searchResults = context.document.body.search(searchText, {
        matchCase: false,
        matchWholeWord: false
      });
      
      searchResults.load('items');
      await context.sync();
      
      if (searchResults.items.length === 0) {
        return false;
      }
      
      const range = searchResults.items[0];
      range.font.highlightColor = highlight ? 'Yellow' : 'NoHighlight';
      
      // Scroll to the highlighted text
      if (highlight) {
        range.select();
      }
      
      await context.sync();
      return true;
    }).catch((error) => {
      console.error('Error highlighting text:', error);
      return false;
    });
  }

  /**
   * Clear all highlights
   */
  async clearAllHighlights(): Promise<void> {
    return Word.run(async (context) => {
      const body = context.document.body;
      body.font.highlightColor = 'NoHighlight';
      await context.sync();
    });
  }

  /**
   * Insert text at cursor position
   */
  async insertTextAtCursor(text: string): Promise<boolean> {
    return Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.insertText(text, Word.InsertLocation.replace);
      await context.sync();
      return true;
    }).catch((error) => {
      console.error('Error inserting text:', error);
      return false;
    });
  }

  /**
   * Detect document language (English, Chinese, or mixed)
   */
  detectLanguage(text: string): 'en' | 'zh' | 'mixed' {
    // Count Chinese characters
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    // Count English words (simple approximation)
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    const totalChars = text.length;
    const chineseRatio = chineseChars / totalChars;
    
    if (chineseRatio > 0.3) {
      if (englishWords > 50) {
        return 'mixed';
      }
      return 'zh';
    }
    return 'en';
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    // Count English words
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    // Count Chinese characters as individual words
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    return englishWords + chineseChars;
  }

  /**
   * Get document properties
   */
  async getDocumentProperties(): Promise<{ title: string; author: string }> {
    return Word.run(async (context) => {
      const properties = context.document.properties;
      properties.load(['title', 'author']);
      await context.sync();
      return {
        title: properties.title || 'Untitled Document',
        author: properties.author || 'Unknown'
      };
    });
  }

  /**
   * Enable Track Changes mode
   */
  async enableTrackChanges(): Promise<void> {
    return Word.run(async (context) => {
      // Track changes is enabled per-operation in Word.js
      // This is a placeholder for future implementation if needed
      console.log('Track changes mode ready');
      await context.sync();
    });
  }

  /**
   * Batch apply multiple amendments
   */
  async batchApplyAmendments(
    amendments: Array<{
      type: 'track_change' | 'comment';
      searchText: string;
      replacement?: string;
      comment?: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    
    for (const amendment of amendments) {
      try {
        if (amendment.type === 'track_change' && amendment.replacement) {
          const result = await this.applyTrackChange(
            amendment.searchText,
            amendment.replacement,
            amendment.comment
          );
          if (result) success++;
          else failed++;
        } else if (amendment.type === 'comment' && amendment.comment) {
          const result = await this.addComment(
            amendment.searchText,
            amendment.comment
          );
          if (result) success++;
          else failed++;
        }
      } catch (error) {
        console.error('Error in batch amendment:', error);
        failed++;
      }
    }
    
    return { success, failed };
  }
}

export const wordService = WordService.getInstance();
