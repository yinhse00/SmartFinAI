
/**
 * Enhanced utility for detecting and formatting tables with proper CSS classes
 * PRESERVES existing HTML links and content - adds CSS classes for styling
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
  
  // FIXED: Handle existing HTML tables and add proper CSS classes
  const htmlTableRegex = /<table(?:\s+[^>]*)?>([\s\S]*?)<\/table>/gi;
  const htmlTables: string[] = [];
  
  formattedContent = formattedContent.replace(htmlTableRegex, (match, tableContent) => {
    // Check if table already has CSS classes
    if (match.includes('class=')) {
      // Table already has classes, preserve it
      htmlTables.push(match);
    } else {
      // Add the chat-table class for proper styling
      const styledTable = `<table class="chat-table">${tableContent}</table>`;
      htmlTables.push(styledTable);
    }
    return `__HTML_TABLE_${htmlTables.length - 1}__`;
  });
  
  // Process markdown-style tables with proper CSS classes
  const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n(\|.+\|\s*\n)+/g;
  const tables: string[] = [];
  
  formattedContent = formattedContent.replace(tableRegex, (match) => {
    tables.push(match);
    return `__TABLE_${tables.length - 1}__`;
  });
  
  // Convert markdown-style tables to properly styled HTML tables
  tables.forEach((table, index) => {
    const rows = table.trim().split('\n');
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
    formattedContent = formattedContent.replace(`__TABLE_${index}__`, htmlTable);
  });
  
  // Restore original HTML tables (now with proper CSS classes)
  htmlTables.forEach((table, index) => {
    formattedContent = formattedContent.replace(`__HTML_TABLE_${index}__`, table);
  });
  
  // Finally, restore the preserved links
  existingLinks.forEach((link, index) => {
    formattedContent = formattedContent.replace(`__PRESERVED_LINK_${index}__`, link);
  });
  
  // Debug log to verify tables have proper CSS classes
  if (formattedContent.includes('class="chat-table"')) {
    console.log('✓ Tables formatted with proper CSS classes for borders and styling');
  }
  
  // Debug log to verify links are preserved
  if (existingLinks.length > 0) {
    console.log(`✓ Preserved ${existingLinks.length} existing links in content formatting`);
  }
  
  return formattedContent;
};

export default detectAndFormatTables;
