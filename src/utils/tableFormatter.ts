
/**
 * Enhanced utility for detecting and formatting tables in text content
 * and applying improved text formatting for better readability
 */
const detectAndFormatTables = (content: string): string => {
  if (!content) return '';
  
  let formattedContent = content;
  
  // First, handle any existing HTML tables - we'll leave these untouched
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
  
  // Format semantic HTML elements better
  formattedContent = formattedContent
    // Headers with proper styling
    .replace(/<h1.*?>(.*?)<\/h1>/g, '<h1 class="text-2xl font-bold my-4">$1</h1>')
    .replace(/<h2.*?>(.*?)<\/h2>/g, '<h2 class="text-xl font-semibold my-3">$1</h2>')
    .replace(/<h3.*?>(.*?)<\/h3>/g, '<h3 class="text-lg font-semibold my-3">$1</h3>')
    
    // Lists with proper styling
    .replace(/<ul>/g, '<ul class="list-disc pl-6 my-3">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-6 my-3">')
    .replace(/<li>/g, '<li class="my-1">')
    
    // Line breaks (often misused)
    .replace(/<br>/g, '<br>')
    .replace(/<br\/>/g, '<br>')
    
    // Paragraphs with proper spacing
    .replace(/<p>/g, '<p class="my-2">')
    
    // Tables with proper styling if not already styled
    .replace(/<table(?!\s+class)/g, '<table class="w-full border-collapse my-4"')
    .replace(/<th(?!\s+class)/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-100"')
    .replace(/<td(?!\s+class)/g, '<td class="border border-gray-300 px-4 py-2"');
  
  return formattedContent;
};

export default detectAndFormatTables;
