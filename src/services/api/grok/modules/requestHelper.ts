
/**
 * Helper functions for processing API requests
 */

import { MessageContent } from '../types';

/**
 * Check if the given query appears to be a retry attempt
 * @param content - The message content to check
 * @returns Boolean indicating if it's a retry attempt
 */
export const isRetryAttempt = (content?: string): boolean => {
  if (!content) return false;
  
  const retryPhrases = [
    'retry', 'try again', 'please try again',
    'resend', 'regenerate', 'give it another try',
    'reconnect', 'restore connection', 'fix connection'
  ];
  
  const lowerContent = content.toLowerCase();
  return retryPhrases.some(phrase => lowerContent.includes(phrase));
};

/**
 * Extract text from MessageContent which can be string or array of content objects
 * @param userMessage - The user message object containing content
 * @returns Extracted text as string
 */
export const extractPromptText = (userMessage: any): string => {
  if (!userMessage || !userMessage.content) {
    return "unknown query";
  }
  
  const content = userMessage.content as MessageContent;
  
  // If content is a string, return it directly
  if (typeof content === 'string') {
    return content;
  }
  
  // If content is an array (multimodal), extract all text parts
  if (Array.isArray(content)) {
    const textParts = content
      .filter(part => part.type === 'text' && typeof part.text === 'string')
      .map(part => part.text as string);
    
    if (textParts.length > 0) {
      return textParts.join(' ');
    }
  }
  
  // Fallback
  return "unknown query";
};

/**
 * Detect explicit connectivity restoration requests from user
 * @param content - The message content to check
 * @returns Boolean indicating if it's a reconnection request
 */
export const isConnectivityRequest = (content?: string): boolean => {
  if (!content) return false;
  
  const connectivityPhrases = [
    'fix connection', 'restore connection', 'reconnect', 
    'connectivity issue', 'connection problem', 'back online',
    'offline mode', 'cannot access', 'api connection'
  ];
  
  const lowerContent = content.toLowerCase();
  return connectivityPhrases.some(phrase => lowerContent.includes(phrase));
};

