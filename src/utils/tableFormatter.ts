
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

  // Create HTML table
  const tableRows = rows.map((row, index) => {
    const cells = row.map(cell => {
      const tag = index === 0 ? 'th' : 'td';
      return `<${tag} class="px-4 py-2 border">${cell}</${tag}>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `<table class="min-w-full my-4 border-collapse border">${tableRows}</table>`;
};
