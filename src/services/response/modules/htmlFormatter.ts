
/**
 * HTML formatting service for regulatory responses
 * Handles conversion from markdown to semantic HTML
 */
export const htmlFormatter = {
  /**
   * Apply HTML formatting to text if no HTML is already present
   */
  applyHtmlFormatting: (text: string, skipBoldFormatting: boolean = false): string => {
    // Only apply minimal formatting if no HTML is present
    const hasHtmlFormatting = /<h[1-6]|<p|<strong|<em|<ul|<li|<table|<tr|<th|<td/.test(text);
    
    if (!hasHtmlFormatting) {
      // Convert markdown headers to HTML with black bold styling
      let formattedText = text
        .replace(/^###\s+(.*?)$/gm, '<h3 class="heading-black-bold">$1</h3>')
        .replace(/^##\s+(.*?)$/gm, '<h2 class="heading-black-bold">$1</h2>')
        .replace(/^#\s+(.*?)$/gm, '<h1 class="heading-black-bold">$1</h1>');
      
      // Only apply bold formatting if not skipped
      if (!skipBoldFormatting) {
        formattedText = formattedText
          .replace(/\*\*((?!<a\s).*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*((?!<a\s).*?)\*/g, '<em>$1</em>');
      }
      
      formattedText = formattedText.replace(/^(\s*)[•\-\*](\s+)(.+)$/gm, '<li>$3</li>');
      
      // Convert markdown tables to HTML tables with proper styling
      const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n(\|.+\|\s*\n)+/g;
      formattedText = formattedText.replace(tableRegex, (match) => {
        const rows = match.trim().split('\n');
        let htmlTable = '<table class="chat-table">\n<thead>\n<tr>';
        
        // Process header row
        const headerCells = rows[0].split('|').filter(cell => cell.trim() !== '');
        headerCells.forEach(cell => {
          htmlTable += `<th>${cell.trim()}</th>`;
        });
        htmlTable += '</tr>\n</thead>\n<tbody>';
        
        // Skip the header and separator rows
        for (let i = 2; i < rows.length; i++) {
          if (rows[i].trim() === '') continue;
          
          htmlTable += '<tr>';
          const cells = rows[i].split('|').filter(cell => cell.trim() !== '');
          cells.forEach(cell => {
            htmlTable += `<td>${cell.trim()}</td>`;
          });
          htmlTable += '</tr>\n';
        }
        
        htmlTable += '</tbody>\n</table>';
        return htmlTable;
      });
      
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
