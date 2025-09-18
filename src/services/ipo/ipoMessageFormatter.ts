import { boldFormatter } from '@/services/response/modules/boldFormatter';
import { htmlFormatter } from '@/services/response/modules/htmlFormatter';
import { enhanceWithClickableLinks } from '@/utils/regulatoryReferenceFormatter';
import { codeBlockCleaner } from '@/utils/codeBlockCleaner';

/**
 * IPO-specific message formatting service
 * Applies the same formatting pipeline as main chat for consistency
 */
export const ipoMessageFormatter = {
  /**
   * Format IPO chat message content with HTML, bold formatting, and links
   */
  formatMessage: (content: string): string => {
    let formattedText = content;
    
    // Clean up code block markers first
    formattedText = codeBlockCleaner.cleanupCodeBlockMarkers(formattedText);
    
    // Apply clickable links to regulatory references
    formattedText = enhanceWithClickableLinks(formattedText);
    
    // Apply bold formatting for key regulatory concepts
    formattedText = boldFormatter.enhanceWithBoldFormatting(formattedText);
    
    // Apply HTML formatting (markdown to HTML conversion)
    formattedText = htmlFormatter.applyHtmlFormatting(formattedText);
    
    return formattedText;
  }
};