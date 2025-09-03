import React from 'react';

/**
 * IPO Message Formatter - Formats AI responses for IPO content
 */
export class IPOMessageFormatter {
  
  /**
   * Format AI message content with IPO-specific enhancements
   */
  formatMessage(content: string, responseType?: string, confidence?: number, targetedEdits?: any[]): string {
    // Basic HTML formatting for better readability
    let formatted = content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    
    // Format regulatory citations
    formatted = formatted.replace(
      /(HKEX|Hong Kong Exchange|Listing Rules?|App1A|Appendix 1A)/gi,
      '<strong class="text-blue-600">$1</strong>'
    );
    
    // Format section references
    formatted = formatted.replace(
      /(Section \d+\.\d+|Rule \d+\.\d+|Chapter \d+)/gi,
      '<span class="font-mono text-sm bg-gray-100 px-1 rounded">$1</span>'
    );
    
    // Format improvements and suggestions
    formatted = formatted.replace(
      /\b(improve|enhance|suggest|recommend|consider)\b/gi,
      '<em class="text-green-600">$1</em>'
    );
    
    return formatted;
  }

  /**
   * Format response type for display
   */
  formatResponseType(responseType: string): string {
    return responseType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

export const ipoMessageFormatter = new IPOMessageFormatter();