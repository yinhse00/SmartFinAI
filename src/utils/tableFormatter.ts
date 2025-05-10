
export const detectAndFormatTables = (content: string): string => {
  // Special handling for timetables
  const isTimetable = content.toLowerCase().includes('timetable') || 
                     content.toLowerCase().includes('timeline') ||
                     content.toLowerCase().includes('schedule') || 
                     content.toLowerCase().includes('时间表');
  
  // Split content into lines
  const lines = content.split('\n');
  let inTable = false;
  let formattedContent: string[] = [];
  let currentTable: string[] = [];
  let tableTitle = '';

  // Extract title if this is a timetable
  if (isTimetable) {
    const titleMatch = content.match(/(?:Transaction|Timetable|Schedule|Timeline)(?:\s+for\s+|\s*[-:]\s*|\s+of\s+)?([^\n.]+)/i);
    if (titleMatch && titleMatch[0]) {
      tableTitle = titleMatch[0].trim();
    } else {
      tableTitle = "Transaction Timetable";
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table header (looking for | symbols)
    if (line.includes('|') && !inTable) {
      inTable = true;
      currentTable = [];
      currentTable.push(line);
      
      // If next line contains dashes, it's likely a table header separator
      if (i + 1 < lines.length && (lines[i + 1].includes('-|-') || lines[i + 1].includes('|--'))) {
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
      formattedContent.push(
        isTimetable ? 
        convertToTimetableHtml(currentTable, tableTitle) : 
        convertToHtmlTable(currentTable)
      );
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
    formattedContent.push(
      isTimetable ? 
      convertToTimetableHtml(currentTable, tableTitle) : 
      convertToHtmlTable(currentTable)
    );
  }

  return formattedContent.join('\n');
};

// Basic table conversion for non-timetables
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
    } else if (rowIndex === 1 && (tableLines[1].includes('-|-') || tableLines[1].includes('|--'))) {
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

// Special formatting for timetables with status indicators
const convertToTimetableHtml = (tableLines: string[], title: string): string => {
  const rows = tableLines.map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
  );
  
  // Find the reference date if available
  let referenceDate = '';
  const refDateMatch = rows.flat().join(' ').match(/(?:Reference|Start)\s+[Dd]ate:?\s+((?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})/);
  if (refDateMatch && refDateMatch[1]) {
    referenceDate = refDateMatch[1].trim();
  }
  
  // Create enhanced timetable HTML
  let tableHtml = '<div class="overflow-x-auto my-6">\n';
  
  // Add title and subtitle if available
  tableHtml += `<div class="timetable-title">${title}</div>\n`;
  if (referenceDate) {
    tableHtml += `<div class="timetable-subtitle">Reference date: ${referenceDate}</div>\n`;
  }
  
  tableHtml += '<table class="chat-table w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">\n';
  
  // Generate table content with status indicators
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // Header row
      tableHtml += '<thead>\n<tr class="bg-gray-50 dark:bg-gray-700">\n';
      row.forEach(cell => {
        tableHtml += `<th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">${cell}</th>\n`;
      });
      
      // Add Status column if not present
      if (!row.some(cell => cell.toLowerCase().includes('status'))) {
        tableHtml += `<th class="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>\n`;
      }
      
      tableHtml += '</tr>\n</thead>\n<tbody>\n';
    } else if (rowIndex === 1 && (tableLines[1].includes('-|-') || tableLines[1].includes('|--'))) {
      // Skip separator row
      return;
    } else {
      // Data rows
      tableHtml += '<tr class="border-t border-gray-200 dark:border-gray-700">\n';
      
      // Process each cell, looking for date indicators
      let hasStatus = false;
      row.forEach((cell, cellIndex) => {
        // Check if this is a status cell
        if (cell.toLowerCase().includes('complete') || 
            cell.toLowerCase().includes('pending') || 
            cell.toLowerCase().includes('upcoming')) {
          hasStatus = true;
          tableHtml += `<td class="px-6 py-4 text-sm">`;
          
          if (cell.toLowerCase().includes('complete')) {
            tableHtml += `<span class="status-completed">Completed</span>`;
          } else if (cell.toLowerCase().includes('pending')) {
            tableHtml += `<span class="status-pending">Pending</span>`;
          } else {
            tableHtml += `<span class="status-upcoming">Upcoming</span>`;
          }
          
          tableHtml += `</td>\n`;
        }
        // Format date cells nicely
        else if (cell.match(/(?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/)) {
          tableHtml += `<td class="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">${cell}</td>\n`;
        }
        // Regular cell
        else {
          tableHtml += `<td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">${cell}</td>\n`;
        }
      });
      
      // Add inferred status if no status column found
      if (!hasStatus && row.some(cell => cell.match(/(?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/))) {
        const dateCell = row.find(cell => cell.match(/(?:\w{3}, )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/));
        if (dateCell) {
          const date = new Date(dateCell);
          const today = new Date();
          
          if (date < today) {
            tableHtml += `<td class="px-6 py-4 text-sm"><span class="status-completed">Completed</span></td>\n`;
          } else if (Math.abs(date.getTime() - today.getTime()) < 24 * 3600 * 1000) {
            tableHtml += `<td class="px-6 py-4 text-sm"><span class="status-pending">Pending</span></td>\n`;
          } else {
            tableHtml += `<td class="px-6 py-4 text-sm"><span class="status-upcoming">Upcoming</span></td>\n`;
          }
        } else {
          tableHtml += `<td class="px-6 py-4 text-sm"><span class="status-upcoming">Upcoming</span></td>\n`;
        }
      }
      
      tableHtml += '</tr>\n';
    }
  });
  
  tableHtml += '</tbody>\n</table>\n</div>';
  return tableHtml;
};
