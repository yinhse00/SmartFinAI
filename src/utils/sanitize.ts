import DOMPurify from 'dompurify';

/**
 * Security utility for sanitizing HTML content to prevent XSS attacks
 */

// Configure DOMPurify with safe defaults
const config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 
    'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param allowedTags - Optional custom allowed tags (overrides defaults)
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string, allowedTags?: string[]): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const customConfig = allowedTags 
    ? { ...config, ALLOWED_TAGS: allowedTags }
    : config;

  return DOMPurify.sanitize(dirty, customConfig);
}

/**
 * Sanitizes HTML and returns an object suitable for dangerouslySetInnerHTML
 * @param dirty - The potentially unsafe HTML string
 * @returns Object with __html property containing sanitized content
 */
export function createSafeMarkup(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) };
}

/**
 * Strips all HTML tags from a string, leaving only text content
 * @param html - HTML string to strip
 * @returns Plain text without any HTML tags
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}
