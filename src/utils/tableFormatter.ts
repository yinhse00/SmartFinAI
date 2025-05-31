
/**
 * Simplified utility for detecting and formatting tables in text content
 * PRESERVES existing HTML links and content - MINIMAL formatting only
 */
const detectAndFormatTables = (content: string): string => {
  if (!content) return '';
  
  let formattedContent = content;
  
  // First, preserve any existing HTML links by replacing them with placeholders
  const existingLinks: string[] = [];
  const linkRegex = /<a\s+[^>]*>.*?<\/a>/gi;
  
  formattedContent = formattedContent.replace(linkRegex, (match) => {
    existingLinks.push(match);
    return `__PRESERVED_LINK_${existingLinks.length - 1}__`;
  });
  
  // Handle any existing HTML tables - leave these untouched
  const htmlTableRegex = /<table[\s\S]*?<\/table>/g;
  const htmlTables: string[] = [];
  
  formattedContent = formattedContent.replace(htmlTableRegex, (match) => {
    htmlTables.push(match);
    return `__HTML_TABLE_${htmlTables.length - 1}__`;
  });
  
  // Process markdown-style tables with MINIMAL styling
  const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n(\|.+\|\s*\n)+/g;
  const tables: string[] = [];
  
  formattedContent = formattedContent.replace(tableRegex, (match) => {
    tables.push(match);
    return `__TABLE_${tables.length - 1}__`;
  });
  
  // Convert markdown-style tables to clean HTML tables
  tables.forEach((table, index) => {
    const rows = table.trim().split('\n');
    let htmlTable = '<table>\n<thead>\n<tr>';
    
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
    formattedContent = formattedContent.replace(`__TABLE_${index}__`, htmlTable);
  });
  
  // Restore original HTML tables
  htmlTables.forEach((table, index) => {
    formattedContent = formattedContent.replace(`__HTML_TABLE_${index}__`, table);
  });
  
  // Finally, restore the preserved links
  existingLinks.forEach((link, index) => {
    formattedContent = formattedContent.replace(`__PRESERVED_LINK_${index}__`, link);
  });
  
  // Debug log to verify links are preserved
  if (existingLinks.length > 0) {
    console.log(`Preserved ${existingLinks.length} existing links in content formatting`);
  }
  
  return formattedContent;
};

export default detectAndFormatTables;
