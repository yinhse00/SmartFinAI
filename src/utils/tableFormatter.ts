
export const detectAndFormatTables = (content: string): string => {
  // Split content into lines
  const lines = content.split('\n');
  let inTable = false;
  let formattedContent: string[] = [];
  let currentTable: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table header (looking for | symbols)
    if (line.includes('|') && !inTable) {
      inTable = true;
      currentTable = [];
      currentTable.push(line);
      
      // If next line contains dashes, it's likely a table header separator
      if (i + 1 < lines.length && lines[i + 1].includes('-|-')) {
        currentTable.push(lines[i + 1]);
        i++; // Skip the separator line in main loop
      }
    }
    // Continue collecting table rows
    else if (inTable && line.includes('|')) {
      currentTable.push(line);
    }
    // Table has ended
    else if (inTable) {
      inTable = false;
      // Convert collected table to HTML
      formattedContent.push(convertToHtmlTable(currentTable));
      currentTable = [];
      if (line) formattedContent.push(line);
    }
    // Regular non-table content
    else {
      formattedContent.push(line);
    }
  }

  // Handle any remaining table
  if (currentTable.length > 0) {
    formattedContent.push(convertToHtmlTable(currentTable));
  }

  return formattedContent.join('\n');
};

const convertToHtmlTable = (tableLines: string[]): string => {
  const rows = tableLines.map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
  );

  // Create HTML table with enhanced styling
  let tableHtml = '<div class="overflow-x-auto my-4">\n';
  tableHtml += '<table class="chat-table w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">\n';
  
  // Generate table content
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // Header row
      tableHtml += '<thead>\n<tr class="bg-gray-50 dark:bg-gray-700">\n';
      row.forEach(cell => {
        tableHtml += `<th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">${cell}</th>\n`;
      });
      tableHtml += '</tr>\n</thead>\n<tbody>\n';
    } else if (rowIndex === 1 && tableLines[1].includes('-|-')) {
      // Skip separator row
      return;
    } else {
      // Data rows
      tableHtml += '<tr class="border-t border-gray-200 dark:border-gray-700">\n';
      row.forEach(cell => {
        tableHtml += `<td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">${cell}</td>\n`;
      });
      tableHtml += '</tr>\n';
    }
  });
  
  tableHtml += '</tbody>\n</table>\n</div>';
  return tableHtml;
};
