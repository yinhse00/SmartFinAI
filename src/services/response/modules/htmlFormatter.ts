
/**
 * HTML formatting service for regulatory responses
 * Handles conversion from markdown to semantic HTML
 */
export const htmlFormatter = {
  /**
   * Apply HTML formatting to text if no HTML is already present
   */
  applyHtmlFormatting: (text: string): string => {
    // Only apply minimal formatting if no HTML is present
    const hasHtmlFormatting = /<h[1-6]|<p|<strong|<em|<ul|<li|<table|<tr|<th|<td/.test(text);
    
    if (!hasHtmlFormatting) {
      // Convert markdown headers to HTML with black bold styling
      let formattedText = text
        .replace(/^###\s+(.*?)$/gm, '<h3 class="heading-black-bold">$1</h3>')
        .replace(/^##\s+(.*?)$/gm, '<h2 class="heading-black-bold">$1</h2>')
        .replace(/^#\s+(.*?)$/gm, '<h1 class="heading-black-bold">$1</h1>')
        .replace(/\*\*((?!<a\s).*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*((?!<a\s).*?)\*/g, '<em>$1</em>')
        .replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<li>$3</li>');
      
      // Simple paragraph wrapping without CSS classes
      const paragraphs = formattedText.split(/\n\n+/);
      formattedText = paragraphs.map(p => {
        if (p.trim().startsWith('<') || p.trim().length === 0) return p;
        return `<p>${p.trim()}</p>`;
      }).join('\n\n');
      
      return formattedText;
    }
    
    return text;
  }
};
