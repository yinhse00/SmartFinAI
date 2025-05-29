
/**
 * Enhanced utility for detecting and formatting tables in text content
 * and applying improved text formatting for better readability
 * PRESERVES existing HTML links and content
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
  
  // Then, handle any existing HTML tables - we'll leave these untouched
  const htmlTableRegex = /<table[\s\S]*?<\/table>/g;
  const htmlTables: string[] = [];
  
  formattedContent = formattedContent.replace(htmlTableRegex, (match) => {
    htmlTables.push(match);
    return `__HTML_TABLE_${htmlTables.length - 1}__`;
  });
  
  // Process markdown-style tables
  const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n(\|.+\|\s*\n)+/g;
  const tables: string[] = [];
  
  formattedContent = formattedContent.replace(tableRegex, (match) => {
    tables.push(match);
    return `__TABLE_${tables.length - 1}__`;
  });
  
  // Convert markdown-style tables to HTML tables
  tables.forEach((table, index) => {
    const rows = table.trim().split('\n');
    let htmlTable = '<table class="w-full border-collapse my-4">\n<thead>\n<tr>';
    
    // Process header row
    const headerCells = rows[0].split('|').filter(cell => cell.trim() !== '');
    headerCells.forEach(cell => {
      htmlTable += `<th class="border border-gray-300 px-4 py-2 bg-gray-100">${cell.trim()}</th>`;
    });
    htmlTable += '</tr>\n</thead>\n<tbody>';
    
    // Skip the header and separator rows
    for (let i = 2; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      
      htmlTable += '<tr>';
      const cells = rows[i].split('|').filter(cell => cell.trim() !== '');
      cells.forEach(cell => {
        htmlTable += `<td class="border border-gray-300 px-4 py-2">${cell.trim()}</td>`;
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
  
  // Format semantic HTML elements better, but be careful not to affect preserved links
  formattedContent = formattedContent
    // Headers with proper styling
    .replace(/<h1(?!\s+class)([^>]*)>/g, '<h1 class="text-2xl font-bold my-4"$1>')
    .replace(/<h2(?!\s+class)([^>]*)>/g, '<h2 class="text-xl font-semibold my-3"$1>')
    .replace(/<h3(?!\s+class)([^>]*)>/g, '<h3 class="text-lg font-semibold my-3"$1>')
    
    // Lists with proper styling
    .replace(/<ul(?!\s+class)>/g, '<ul class="list-disc pl-6 my-3">')
    .replace(/<ol(?!\s+class)>/g, '<ol class="list-decimal pl-6 my-3">')
    .replace(/<li(?!\s+class)>/g, '<li class="my-1">')
    
    // Line breaks (often misused)
    .replace(/<br>/g, '<br>')
    .replace(/<br\/>/g, '<br>')
    
    // Paragraphs with proper spacing
    .replace(/<p(?!\s+class)>/g, '<p class="my-2">')
    
    // Tables with proper styling if not already styled
    .replace(/<table(?!\s+class)/g, '<table class="w-full border-collapse my-4"')
    .replace(/<th(?!\s+class)/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-100"')
    .replace(/<td(?!\s+class)/g, '<td class="border border-gray-300 px-4 py-2"');
  
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
