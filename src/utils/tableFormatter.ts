import { format, parseISO, isValid } from 'date-fns';

/**
 * Detects if a string is a valid date
 */
const isDateString = (str: string): boolean => {
  // Common date formats to detect
  const datePatterns = [
    // ISO format: 2023-05-15
    /^\d{4}-\d{2}-\d{2}$/,
    // Date with time: 2023-05-15 14:30:00
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/,
    // Date format: 15/05/2023 or 15-05-2023
    /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/,
    // Month name format: 15 May 2023
    /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}$/i
  ];
  
  // Check if the string matches any date pattern
  if (!datePatterns.some(pattern => pattern.test(str))) {
    return false;
  }
  
  // Further validate by trying to parse it
  try {
    const parsed = parseISO(str);
    return isValid(parsed);
  } catch (e) {
    try {
      // Try a different approach for non-ISO formats
      const date = new Date(str);
      return isValid(date);
    } catch (e) {
      return false;
    }
  }
};

/**
 * Determines if a table is likely a timetable based on column content
 */
const isTimetable = (tableData: string[][]): boolean => {
  // If first row has date-related terms, it's likely a timetable
  const dateHeaders = ['date', 'day', 'time', 'deadline', 'schedule', 'due', 'period', 'start', 'end'];
  const firstRow = tableData[0].map(cell => cell.toLowerCase());
  
  const hasDateHeader = firstRow.some(cell => 
    dateHeaders.some(term => cell.includes(term))
  );
  
  // Check if any column has multiple date values
  if (tableData.length > 2) {
    const columns = tableData[0].length;
    for (let col = 0; col < columns; col++) {
      let dateCount = 0;
      for (let row = 1; row < tableData.length; row++) {
        if (tableData[row][col] && isDateString(tableData[row][col])) {
          dateCount++;
        }
      }
      if (dateCount > 1) return true;
    }
  }
  
  return hasDateHeader;
};

/**
 * Detects text alignment markers in cell content
 */
const detectAlignment = (cell: string): { content: string, align: 'left' | 'center' | 'right' } => {
  cell = cell.trim();
  
  if (cell.startsWith('->') && cell.endsWith('<-')) {
    return { content: cell.slice(2, -2).trim(), align: 'center' };
  } else if (cell.startsWith('->')) {
    return { content: cell.slice(2).trim(), align: 'right' };
  } else if (cell.endsWith('<-')) {
    return { content: cell.slice(0, -2).trim(), align: 'left' };
  }
  
  // Default to left alignment
  return { content: cell, align: 'left' };
};

/**
 * Process markdown formatting (**, ##, etc.) in text
 */
const processMarkdownFormatting = (text: string): string => {
  // Replace headers (###) with HTML headers
  text = text.replace(/^###\s+(.+)$/gm, '<h3 class="font-bold text-lg my-2">$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2 class="font-bold text-xl my-3">$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1 class="font-bold text-2xl my-4">$1</h1>');
  
  // Replace bold (**text**) with <strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Remove underline (_text_) handling as requested - use emphasis instead
  text = text.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');
  
  // Process blockquotes (> text) - keep simple styling without underlines
  text = text.replace(/^>\s+(.+)$/gm, '<blockquote class="pl-4 border-l-4 border-gray-300 my-2 italic">$1</blockquote>');
  
  // Process unordered lists for better readability with bullet points
  // Match lines starting with - or * followed by space
  let inList = false;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // Check if line is a list item
    if (lines[i].match(/^\s*[-*]\s+/)) {
      // Start a new list if we're not in one
      if (!inList) {
        lines[i] = '<ul class="list-disc pl-6 my-2">\n' + lines[i].replace(/^\s*[-*]\s+(.+)$/, '<li>$1</li>');
        inList = true;
      } else {
        // Continue existing list
        lines[i] = lines[i].replace(/^\s*[-*]\s+(.+)$/, '<li>$1</li>');
      }
      
      // Check if next line is not a list item or is the last line
      if (i === lines.length - 1 || !lines[i+1].match(/^\s*[-*]\s+/)) {
        lines[i] = lines[i] + '\n</ul>';
        inList = false;
      }
    }
  }
  text = lines.join('\n');
  
  return text;
};

/**
 * Preserves paragraph formatting in text
 */
const preserveParagraphs = (text: string): string => {
  // Split by double newlines (paragraph breaks)
  const paragraphs = text.split(/\n\n+/);
  
  // Process each paragraph
  return paragraphs.map(paragraph => {
    // Skip processing if it's already HTML or empty
    if (paragraph.trim().startsWith('<') || paragraph.trim() === '') {
      return paragraph;
    }
    
    // For regular paragraphs, wrap in p tags
    // But avoid wrapping if it starts with a heading tag or is part of a list
    if (!/^<(h[1-6]|ul|li|blockquote)/i.test(paragraph.trim())) {
      return `<p class="mb-4">${paragraph.replace(/\n/g, '<br/>')}</p>`;
    }
    
    return paragraph;
  }).join('\n\n');
};

/**
 * Main function to detect and format tables in text content
 */
export const detectAndFormatTables = (content: string): string => {
  // Process markdown formatting first
  content = processMarkdownFormatting(content);
  
  // Split content into lines
  const lines = content.split('\n');
  let inTable = false;
  let formattedContent: string[] = [];
  let currentTable: string[] = [];
  let currentTextBlock: string[] = [];

  const flushTextBlock = () => {
    if (currentTextBlock.length > 0) {
      formattedContent.push(currentTextBlock.join('\n'));
      currentTextBlock = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table header (looking for | symbols)
    if (line.includes('|') && line.trim().startsWith('|') && !inTable) {
      // Flush any text before the table
      flushTextBlock();
      
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
    else if (inTable && line.includes('|') && line.trim().startsWith('|')) {
      currentTable.push(line);
    }
    // Table has ended
    else if (inTable) {
      inTable = false;
      // Convert collected table to HTML
      formattedContent.push(convertToHtmlTable(currentTable));
      currentTable = [];
      if (line) currentTextBlock.push(line);
    }
    // Regular non-table content
    else {
      currentTextBlock.push(line);
    }
  }

  // Handle any remaining table
  if (currentTable.length > 0) {
    formattedContent.push(convertToHtmlTable(currentTable));
  }
  
  // Handle any remaining text
  flushTextBlock();

  // Join all content and preserve paragraphs
  return preserveParagraphs(formattedContent.join('\n\n'));
};

/**
 * Convert markdown-style table lines to an HTML table with enhanced styling
 */
const convertToHtmlTable = (tableLines: string[]): string => {
  // Parse table data from lines
  const tableData = tableLines.map(line => 
    line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0)
  );

  // Process alignment and content in each cell
  const processedData = tableData.map(row => 
    row.map(cell => detectAlignment(cell))
  );
  
  // Determine if this is a timetable
  const isTimetableFormat = isTimetable(tableData);
  
  // Create HTML table with enhanced styling and visible borders
  let tableHtml = '<div class="overflow-x-auto my-4">\n';
  tableHtml += `<table class="chat-table w-full border-collapse ${isTimetableFormat ? 'timetable-format' : ''}">\n`;
  
  // Generate table content
  processedData.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // Header row
      tableHtml += '<thead>\n<tr>\n';
      row.forEach(cell => {
        tableHtml += `<th class="text-${cell.align} border border-gray-300 dark:border-gray-600">${cell.content}</th>\n`;
      });
      tableHtml += '</tr>\n</thead>\n<tbody>\n';
    } else if (rowIndex === 1 && tableLines[1].includes('-|-')) {
      // Skip separator row
      return;
    } else {
      // Data rows
      const rowClasses = [];
      
      // Check if row has status indicators
      const hasStatus = row.some(cell => 
        ['pending', 'completed', 'upcoming', 'in progress', 'delayed'].some(
          status => cell.content.toLowerCase().includes(status)
        )
      );
      
      if (hasStatus) {
        if (row.some(cell => cell.content.toLowerCase().includes('completed'))) {
          rowClasses.push('completed-row');
        } else if (row.some(cell => cell.content.toLowerCase().includes('in progress'))) {
          rowClasses.push('in-progress-row');
        } else if (row.some(cell => cell.content.toLowerCase().includes('pending'))) {
          rowClasses.push('pending-row');
        } else if (row.some(cell => cell.content.toLowerCase().includes('delayed'))) {
          rowClasses.push('delayed-row');
        } else if (row.some(cell => cell.content.toLowerCase().includes('upcoming'))) {
          rowClasses.push('upcoming-row');
        }
      }
      
      tableHtml += `<tr class="${rowClasses.join(' ')}">\n`;
      row.forEach(cell => {
        // Add special formatting for date cells
        const cellClasses = [];
        if (isDateString(cell.content)) {
          cellClasses.push('date-cell');
        }
        
        tableHtml += `<td class="text-${cell.align} ${cellClasses.join(' ')} border border-gray-300 dark:border-gray-600">${cell.content}</td>\n`;
      });
      tableHtml += '</tr>\n';
    }
  });
  
  tableHtml += '</tbody>\n</table>\n</div>';
  return tableHtml;
};

export default detectAndFormatTables;
