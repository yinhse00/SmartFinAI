/**
 * Table detection and formatting utility
 * Detects markdown tables in text and converts them to HTML tables
 */

const detectAndFormatTables = (text: string): string => {
  // Regex to detect markdown tables
  const tableRegex = /\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n(\|.+\|\s*\n)+/g;
  
  // Replace markdown tables with HTML tables
  return text.replace(tableRegex, (match) => {
    // Check if this is a timetable by looking for common timetable headers
    const isTimetable = /day|date|event|status/i.test(match);
    
    if (isTimetable) {
      // Use enhanced timetable rendering component
      return `<div class="chat-timetable-container" data-table-content="${encodeURIComponent(match)}"></div>`;
    }
    
    // Standard table processing for non-timetables
    const rows = match.trim().split('\n');
    let htmlTable = '<table style="border-collapse: collapse; width: 100%; border: 2px solid #cbd5e0; margin: 1rem 0;">\n<thead>\n<tr>';
    
    // Process header row
    const headerCells = rows[0].split('|').filter(cell => cell.trim() !== '');
    headerCells.forEach(cell => {
      htmlTable += `<th style="border: 1px solid #cbd5e0; padding: 0.75rem 1rem; text-align: left; background-color: rgba(0, 76, 153, 0.1);">${cell.trim()}</th>`;
    });
    htmlTable += '</tr>\n</thead>\n<tbody>';
    
    // Skip the header and separator rows
    for (let i = 2; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      
      const isEvenRow = (i - 2) % 2 === 0;
      const rowBgColor = isEvenRow ? 'rgba(0, 76, 153, 0.03)' : 'transparent';
      
      htmlTable += `<tr style="background-color: ${rowBgColor};">`;
      const cells = rows[i].split('|').filter(cell => cell.trim() !== '');
      cells.forEach(cell => {
        htmlTable += `<td style="border: 1px solid #cbd5e0; padding: 0.75rem 1rem; text-align: left;">${cell.trim()}</td>`;
      });
      htmlTable += '</tr>\n';
    }
    
    htmlTable += '</tbody>\n</table>';
    return htmlTable;
  });
};

export default detectAndFormatTables;